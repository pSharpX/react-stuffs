const endpoint = "https://dkj6kit9eb.execute-api.us-east-2.amazonaws.com";

const region = "us-east-2";
const userPoolId = "us-east-2_oYyBgwLfv";
const clientId = "6b97fkj684sp4p3a6ntos5gksn";
const identityPoolId = "us-east-2:ca810ad7-81eb-4c86-902a-59e20d2ece8f";

const username = "ctiszav@gmail.com";
const password = "Passw0rd!";

var cognitoUser;

document.addEventListener("DOMContentLoaded", function(event) {
  var btnIn = document.getElementById("signin");
  btnIn.addEventListener("click", function(e) {
    signIn(username, password);
  });

  var btnOut = document.getElementById("signout");
  btnOut.addEventListener("click", function(e) {
    signOut(username, password);
  });

  var check = document.getElementById("check");
  check.addEventListener("click", function(e) {
    getCurrentUserFunct();
  });

  var invoke = document.getElementById("invoke");
  invoke.addEventListener("click", function(e) {
    const path = "/desa/v1/bscpoliza";
    const method = "post";
    const headers = {};
    const queryParams = {};
    const body = {
      codProd: "3001",
      numPol: "500814",
      numCert: "",
      fecIniVig: "",
      fecFinVig: "",
      numIdAseg: "",
      tipRel: "3",
      stsPol: "ACT",
      idePol: "",
      tipoCanal: "FRS",
      idUsuario: "XT1425",
      auditoria: {
        ip: "172.25.14.148",
        usuario: "ctiszav@gmail.com",
        fechaTrans: "2019/05/28",
        horaTrans: "23:03:57"
      }
    };
    invokeApiAjax(path, method, headers, queryParams, body);
  });
});

function getCurrentUserFunct() {
  var data = {
    UserPoolId: userPoolId, // Your user pool id here
    ClientId: clientId // Your client id here
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
  cognitoUser = userPool.getCurrentUser();

  if (cognitoUser != null) {
    cognitoUser.getSession(function(err, session) {
      if (err) {
        alert(err);
        return;
      }
      console.log("session validity: " + session.isValid());
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identityPoolId, // your identity pool id here
        Logins: {
          // Change the key below according to the specific region your user pool is in.
          [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: session
            .getIdToken()
            .getJwtToken()
        }
      });
      // Instantiate aws sdk service objects now that the credentials have been updated.
      // example: var s3 = new AWS.S3();
    });
  }
}

function signIn(username, password) {
  var authenticationData = {
    Username: username,
    Password: password
  };
  var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
    authenticationData
  );
  var poolData = { UserPoolId: userPoolId, ClientId: clientId };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  var userData = {
    Username: username,
    Pool: userPool
  };
  cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function(result) {
      console.log(result);
      var accessToken = result.getAccessToken().getJwtToken();
      /* Use the idToken for Logins Map when Federating User Pools with identity pools or when passing through an Authorization Header to an API Gateway Authorizer*/
      var idToken = result.idToken.jwtToken;
      alert("authenticated!");
    },
    onFailure: function(err) {
      alert(err);
    }
  });
}

function signOut() {
  if (cognitoUser != null) {
    cognitoUser.signOut();
  }
}

/**** Authenticate a User with Cognito User Pool */

function login(username, password) {
  const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId
  });
  const user = new CognitoUser({ Username: username, Pool: userPool });
  const authenticationData = { Username: username, Password: password };
  const authenticationDetails = new AuthenticationDetails(authenticationData);

  return new Promise((resolve, reject) =>
    user.authenticateUser(authenticationDetails, {
      onSuccess: result => resolve(),
      onFailure: err => reject(err)
    })
  );
}

function getUserToken(currentUser) {
  return new Promise((resolve, reject) => {
    currentUser.getSession(function(err, session) {
      if (err) {
        reject(err);
        return;
      }
      resolve(session.getIdToken().getJwtToken());
    });
  });
}

function getCurrentUser() {
  const userPool = new AmazonCognitoIdentity.CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId
  });
  return userPool.getCurrentUser();
}

function getAwsCredentials(userToken) {
  const authenticator = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

  AWS.config.update({ region: region });

  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
    Logins: {
      [authenticator]: userToken
    }
  });

  return AWS.config.credentials.getPromise();
}

function invokeApiFetch(path, method, headers, queryParams, body) {
  const currentUser = getCurrentUser();

  getUserToken(currentUser)
    .then(getAwsCredentials)
    .then(function() {
      console.log(AWS.config.credentials);

      const signedRequest = sigV4Client
        .newClient({
          accessKey: AWS.config.credentials.accessKeyId,
          secretKey: AWS.config.credentials.secretAccessKey,
          sessionToken: AWS.config.credentials.sessionToken,
          region: region,
          endpoint: endpoint
        })
        .signRequest({
          method,
          path,
          headers,
          queryParams,
          body
        });

      body = body ? JSON.stringify(body) : body;
      headers = signedRequest.headers;

      fetch(signedRequest.url, {
        method,
        headers,
        body
      })
        .then(function(results) {
          if (results.status !== 200) {
            throw new Error("err");
          }
          return results.json();
        })
        .then(function(json) {
          console.log(json);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
}

function invokeApiAxios(path, method, headers, queryParams, body) {
  const currentUser = getCurrentUser();

  getUserToken(currentUser)
    .then(getAwsCredentials)
    .then(function() {
      console.log(AWS.config.credentials);

      const signedRequest = sigV4Client
        .newClient({
          accessKey: AWS.config.credentials.accessKeyId,
          secretKey: AWS.config.credentials.secretAccessKey,
          sessionToken: AWS.config.credentials.sessionToken,
          region: region,
          endpoint: endpoint
        })
        .signRequest({
          method,
          path,
          headers,
          queryParams,
          body
        });

      headers = signedRequest.headers;
      axios({
        url: signedRequest.url,
        method,
        headers,
        data: body
      })
        .then(function(results) {
          //   if (results.status !== 200) {
          //     throw new Error("err");
          //   }
          console.log(results);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
}

function invokeApiAjax(path, method, headers, queryParams, body) {
  const currentUser = getCurrentUser();

  getUserToken(currentUser)
    .then(getAwsCredentials)
    .then(function() {
      console.log(AWS.config.credentials);

      const signedRequest = sigV4Client
        .newClient({
          accessKey: AWS.config.credentials.accessKeyId,
          secretKey: AWS.config.credentials.secretAccessKey,
          sessionToken: AWS.config.credentials.sessionToken,
          region: region,
          endpoint: endpoint
        })
        .signRequest({
          method,
          path,
          headers,
          queryParams,
          body
        });

	  headers = signedRequest.headers;
      $.ajax({
        url: signedRequest.url,
        crossDomain: true,
		contentType: "application/json",
        type: method,
        headers,
		data: JSON.stringify(body),
        success: function(data, textStatus, jqXHR) {
          console.log(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(errorThrown);
        }
      });
    });
}
