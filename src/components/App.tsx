import React from 'react';
import {HashRouter, Switch, Route} from 'react-router-dom';
import {Header} from './Header'
import {Archive, Post} from './Archive'

import './App.css'

function NotFound() {
  return (
    <div className="post">
      <h1>404</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="app">
      <div className="container">
        <HashRouter>
          <Header />
          <Switch>
            <Route exact path="/" component={Archive} />
            <Route path="/a/:post" component={Post} />
            <Route component={NotFound} />
          </Switch>
        </HashRouter>
      </div>
    </div>
  );
}
