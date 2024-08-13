let post_this = null;
let reply_this = null;


class Post extends React.Component {
  constructor(props) {
    super(props);
    post_this = this;

    this.state = {
      post: null,
      isLoading: true,
      error: null
    };
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


export {
  Post,
  ReplyPostForm,
  post_this,
  reply_this,
};
