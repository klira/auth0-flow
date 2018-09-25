import React from "react";
import ReactDOM from "react-dom";
import Auth from "../../../index.js";


const auth = new Auth({
  domain: "opensource-tests.eu.auth0.com",
  clientID: "HrOcMACcA0cEYTbZjIJxPIGFheRxz1HK",
})

const App = () => {
  return <div>Simple-app</div>;
};

window.auth = auth

auth.whenAuthenticated(() => {
  ReactDOM.render(<App />, document.getElementById("root"));
});
