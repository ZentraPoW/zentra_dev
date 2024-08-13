let post_this = null;
let reply_this = null;
let post_list_this = null;


class Post extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      post: null,
      isLoading: true,
      error: null
    };

    post_this = this;
  }

  componentDidMount() {
    this.fetchPost();
  }

  fetchPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    fetch(`/api/post?id=${postId}`)
      .then(response => response.json())
      .then(data => {
        this.setState({
          post: data,
          isLoading: false
        });
      })
      .catch(error => {
        this.setState({
          error: 'Failed to fetch post',
          isLoading: false
        });
      });
  }

  render() {
    const { post, isLoading, error } = this.state;

    if (isLoading) {
      return React.createElement('div', null, 'Loading post...');
    }

    if (error) {
      return React.createElement('div', null, error);
    }

    if (!post) {
      return React.createElement('div', null, 'Post not found');
    }

    return React.createElement(
      'div',
      { className: 'box post' },
      React.createElement('h2', { className: 'title is-4' }, post.title),
      React.createElement('p', { className: 'subtitle is-6' }, `Posted by: ${post.author}`),
      React.createElement('div', { 
        className: 'content',
        dangerouslySetInnerHTML: { __html: marked.parse(post.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) }
      }),
      React.createElement(
        'div',
        { className: 'replies' },
        React.createElement('h3', { className: 'title is-5' }, 'Replies'),
        post.replies && post.replies.length > 0
          ? post.replies.map(reply =>
              React.createElement(
                'div',
                { key: reply.id, className: 'box reply' },
                React.createElement('p', { className: 'subtitle is-6' }, `Reply by: Anonymous`),
                React.createElement('div', { 
                  className: 'content',
                  dangerouslySetInnerHTML: { __html: marked.parse(reply.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) }
                })
              )
            )
          : React.createElement('p', null, 'No replies yet.')
      )
    );
  }
}


class ReplyPostForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      content: '',
      preview: ''
    };

    reply_this = this;
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    // Here you would typically call your API to create a new reply
    console.log('Submitting new reply:', { content: this.state.content, postId });
    // Send HTTP POST request using fetch API
    fetch('/api/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: this.state.content, post_id: postId }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      // Reset form after submission
      this.setState({
        content: '',
        preview: ''
      });

      post_this.fetchPost();
    })
    .catch((error) => {
      console.error('Error:', error);
      // Handle any errors here, such as showing an error message to the user
    });
  };

  handleContentChange = (e) => {
    const newContent = e.target.value;
    this.setState({
      content: newContent,
      preview: marked.parse(newContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    });
  };

  insertMarkdown = (tag) => {
    const textarea = document.querySelector('textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    let insertion = '';

    switch(tag) {
      case 'h1':
        insertion = '# ';
        break;
      case 'h2':
        insertion = '## ';
        break;
      case 'h3':
        insertion = '### ';
        break;
      case 'img':
        insertion = '![alt text](image_url)';
        break;
      case 'code':
        insertion = '```\n\n```';
        break;
    }

    const newText = text.substring(0, start) + insertion + text.substring(end);
    this.setState({
      content: newText,
      preview: marked.parse(newText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    });
    textarea.focus();
    textarea.setSelectionRange(start + insertion.length, start + insertion.length);
  };

  render() {
    return React.createElement(
      'div',
      { className: 'reply-post-form box' },
      React.createElement('h2', { className: 'title is-3' }, 'Create a Reply'),
      React.createElement(
        'form',
        { onSubmit: this.handleSubmit },
        React.createElement(
          'div',
          { className: 'field' },
          React.createElement(
            'div',
            { className: 'control' },
            React.createElement('textarea', {
              className: 'textarea',
              rows: '4',
              placeholder: 'Enter reply content (Markdown supported)',
              value: this.state.content,
              onChange: this.handleContentChange,
              required: true
            })
          )
        ),
        React.createElement(
          'div',
          { className: 'field is-grouped' },
          React.createElement(
            'div',
            { className: 'control' },
            React.createElement(
              'button',
              { className: 'button is-primary', type: 'submit' },
              'Submit Reply'
            )
          ),
          React.createElement(
            'div',
            { className: 'control' },
            React.createElement(
              'div',
              { className: 'buttons' },
              React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => this.insertMarkdown('h1') }, 'H1'),
              React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => this.insertMarkdown('h2') }, 'H2'),
              React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => this.insertMarkdown('h3') }, 'H3'),
              React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => this.insertMarkdown('img') }, 'Image'),
              React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => this.insertMarkdown('code') }, 'Code')
            )
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'content' },
        React.createElement('hr', {}, null),
        React.createElement('h3', { className: 'title is-4' }, 'Preview'),
        React.createElement('div', { dangerouslySetInnerHTML: { __html: this.state.preview } })
      )
    );
  }
}


class PostList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      isLoading: true,
      error: null
    };

    post_list_this = this;
  }

  componentDidMount() {
    this.fetchPosts();
  }

  fetchPosts() {
    fetch('/api/list')
      .then(response => response.json())
      .then(data => {
        this.setState({
          posts: data.posts,
          isLoading: false
        });
      })
      .catch(error => {
        this.setState({
          error: 'Failed to fetch posts',
          isLoading: false
        });
      });
  }

  render() {
    const { posts, isLoading, error } = this.state;

    if (isLoading) {
      return React.createElement('div', null, 'Loading posts...');
    }

    if (error) {
      return React.createElement('div', null, error);
    }

    return React.createElement(
      'div',
      null,
      posts.map(post => 
        React.createElement(
          'div',
          { key: post.id, className: 'box post' },
          React.createElement(
            'a',
            { href: `/post?id=${post.id}`, className: 'title is-4' },
            React.createElement('h2', null, post.title)
          ),
          React.createElement('p', { className: 'subtitle is-6' }, `Posted by: ${post.author}`),
          // React.createElement('div', { className: 'content' }, post.content)
        )
      )
    );
  }
}


function NewPostForm() {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [preview, setPreview] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically call your API to create a new post
    console.log('Submitting new post:', { title, content });
    // Send HTTP POST request using fetch API
    fetch('/api/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      // You can add additional logic here, such as updating the UI or showing a success message
      // Reset form after submission
      setTitle('');
      setContent('');
      setPreview('');

      post_list_this.fetchPosts();
    })
    .catch((error) => {
      console.error('Error:', error);
      // Handle any errors here, such as showing an error message to the user
    });
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setPreview(marked.parse(newContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')));
  };

  const insertMarkdown = (tag) => {
    const textarea = document.querySelector('textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    let insertion = '';

    switch(tag) {
      case 'h1':
        insertion = '# ';
        break;
      case 'h2':
        insertion = '## ';
        break;
      case 'h3':
        insertion = '### ';
        break;
      case 'img':
        insertion = '![alt text](image_url)';
        break;
      case 'code':
        insertion = '```\n\n```';
        break;
    }

    const newText = text.substring(0, start) + insertion + text.substring(end);
    setContent(newText);
    setPreview(marked.parse(newText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')));
    textarea.focus();
    textarea.setSelectionRange(start + insertion.length, start + insertion.length);
  };

  return React.createElement(
    'div',
    { className: 'new-post-form box' },
    React.createElement('h2', { className: 'title is-3' }, 'Create a New Post'),
    React.createElement(
      'form',
      { onSubmit: handleSubmit },
      React.createElement(
        'div',
        { className: 'field' },
        React.createElement(
          'div',
          { className: 'control' },
          React.createElement('input', {
            className: 'input',
            type: 'text',
            placeholder: 'Enter post title',
            value: title,
            onChange: (e) => setTitle(e.target.value),
            required: true
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'field' },
        React.createElement(
          'div',
          { className: 'control' },
          React.createElement('textarea', {
            className: 'textarea',
            rows: '4',
            placeholder: 'Enter post content (Markdown supported)',
            value: content,
            onChange: handleContentChange,
            required: true
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'field is-grouped' },
        React.createElement(
          'div',
          { className: 'control' },
          React.createElement(
            'button',
            { className: 'button is-primary', type: 'submit' },
            'Submit Post'
          )
        ),
        React.createElement(
          'div',
          { className: 'control' },
          React.createElement(
            'div',
            { className: 'buttons' },
            React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => insertMarkdown('h1') }, 'H1'),
            React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => insertMarkdown('h2') }, 'H2'),
            React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => insertMarkdown('h3') }, 'H3'),
            React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => insertMarkdown('img') }, 'Image'),
            React.createElement('button', { type: 'button', className: 'button is-small', onClick: () => insertMarkdown('code') }, 'Code')
          )
        )
      )
    ),
    React.createElement(
      'div',
      { className: 'content' },
      React.createElement('hr', {}, null),
      React.createElement('h3', { className: 'title is-4' }, 'Preview'),
      React.createElement('div', { dangerouslySetInnerHTML: { __html: preview } })
    )
  );
}


export {
  Post,
  ReplyPostForm,
  PostList,
  NewPostForm,
  post_this,
  reply_this,
};
