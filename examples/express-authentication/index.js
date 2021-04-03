let express = require('express');
let WithingsClient = require('withings-ts').default
let app = express();

// https://account.withings.com/partner/add_oauth2
let client = new WithingsClient(
    "<client id>",
    "<client secret>",
    "<callback url>"
)

// 1. First you need redirect user to get authentication code
app.get('/', function (req, res) {
  console.log(client)
  res.redirect(client.generateGetAuthenticationCodeUrl("<state>", ["<scopes>"]))
});

// 2. On callback url, you can get authentication code by query parameter.
//    With that authentication code, you can get access token and refresh token.
//    With using access token, you can call api whatever you want.
app.get('/callback', function (req, res) {
  console.log(req.query);

  // authentication code can be got through query parameter
  let code = req.query.code;

  // get access token by using authentication code
  client.getAccessToken(code).then(function (accessTokenRes) {
    // with access token, you can call api whatever you want limited by scope.
    // access token only valid 3 hours by default.
    // If you want extend expiration, you need to refresh access token by calling `getRefreshToken` and get new access token
    res.json(accessTokenRes);
  });
});

// start app server
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});