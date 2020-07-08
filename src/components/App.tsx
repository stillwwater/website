import React from 'react';
import {HashRouter, Switch, Route} from 'react-router-dom';
import {Header} from './Header'
import {Archive, Post} from './Archive'

import './App.css'

export default function App() {
  return (
    <div className="app">
      <div className="container">
        <HashRouter>
          <Header />
          <Switch>
            <Route exact path="/" component={Archive} />
            <Route path="/a/:post" component={Post}/>
          </Switch>
        </HashRouter>
      </div>
    </div>
  );
}
