import React from "react";
import ReactDOM from "react-dom";
import Auth from "../../../index.js";

const auth = new Auth({
  domain: "opensource-tests.eu.auth0.com",
  clientID: "HrOcMACcA0cEYTbZjIJxPIGFheRxz1HK"
});

const App = ({ data }) => (
  <div>
    You were authenticated successfully! See your session below
    <div>
      <pre>{JSON.stringify(data, null, 4)}</pre>
    </div>
    <div>
      For the purposes of this example, <code>window.auth</code> has been mapped
      to the auth flow object.
    </div>
  </div>
);

window.auth = auth;

auth.whenAuthenticated(result => {
  ReactDOM.render(<App data={result} />, document.getElementById("root"));
});
