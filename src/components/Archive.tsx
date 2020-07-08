import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

import './Archive.css';

const PostsIndex = "posts.json";

type PostMetadata = {
  name: string,
  file: string,
  link: string,
  date: string,
  readtime: number,
};

function makePostUrl(post: PostMetadata): string {
  return `a/${post.link}`;
}

function PostLink(props: {post: PostMetadata}) {
  return (
    <Link to={makePostUrl(props.post)} className="archive-post">
      <span className="archive-post-name">
        <h3>{props.post.name}</h3>
      </span>
      <span className="archive-post-date">
        {props.post.date}
        {props.post.readtime && ` \u2022 ${props.post.readtime} min read`}
      </span>
    </Link>
  )
}

export function Archive() {
  const [posts, setPosts]: [PostMetadata[], any] = useState([]);

  useEffect(() => {
    fetch(PostsIndex)
      .then(res => res.json())
      .then((posts: PostMetadata[]) => setPosts(posts))
      .catch(err => console.error(err));
  }, [setPosts]);

  return (
    <div className="archive">
      <ul>
        {posts.map((post, index) =>
          <li key={index}>
            <PostLink post={post} />
          </li>
        )}
      </ul>
    </div>
  );
}

export function Post(props: any) {
  const md = new MarkdownIt({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(lang, str).value;
        } catch (__) { console.log('err'); }
      }
      return '';
    },
    html: true,
    linkify: true,
  });

  md.use(require('markdown-it-anchor').default, {
    permalink: true,
    // Don't show permalink for the post title header
    level: 2,
    permalinkBefore: false,
    // Link format: /a/article-name/section-name
    slugify: (str: string) =>
      `a/${props.match.params.post}/` +
        str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, ''),
  });

  const [contents, setContents] = useState('');

  useEffect(() => {
    const post = props.match.params.post;
    const file = `${post}.md`;
    if (!post) {
      return;
    }
    // Make sure the url is valid
    fetch(PostsIndex)
      .then(res => res.json())
      .then((posts: PostMetadata[]) => {
        const match = posts.filter(post => post.file === file);
        if (match.length === 0) {
          setContents('# 404\nThe post you are looking for no longer exists.');
          return;
        }
        // Get the markdown contents
        fetch(`posts/${file}`)
          .then(res => res.text())
          .then(text => setContents(text))
          .catch(err => console.error(err));
      })
      .catch(err => console.error(err));
  }, [setContents, props.match.params.post]);

  return (
    <div className="post">
      <div dangerouslySetInnerHTML={{__html: md.render(contents)}} />
    </div>
  )
}
