import React from 'react';
import {Link} from 'react-router-dom'

import "./Header.css"

export function Navigation() {
  return (
    <div className="header-nav">
      <ul>
        <li><Link to="/">archive</Link></li>
        <li><a href="https://gtihub.com/stillwwater">github</a></li>
      </ul>
    </div>
  );
}

export function Header() {
  return (
    <div className="header">
      <div className="header-title">
        <Link to="/"><h1>stillwwater</h1></Link>
      </div>
      <Navigation />
    </div>
  );
}
