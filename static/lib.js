let post_this = null;
let reply_this = null;
let post_list_this = null;

class LoginButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      address: null,
      isMetaMaskInstalled: false,
    };
  }

  componentDidMount() {
    this.checkMetaMaskInstallation();
    this.checkConnection();
  }

  checkMetaMaskInstallation() {
    this.setState({ isMetaMaskInstalled: typeof window.ethereum !== 'undefined' });
  }

  async checkConnection() {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        this.setState({ address: accounts[0] });
      }
    }
  }

  async connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.setState({ address: accounts[0] });
        console.log('Connected with address:', accounts[0]);
      } catch (error) {
        console.error('Failed to connect with MetaMask:', error);
      }
    }
  }

  render() {
    const { address, isMetaMaskInstalled } = this.state;
    
    if (address) {
      return React.createElement(
        'span',
        { className: 'tag is-medium' },
        `${address.slice(0, 6)}...${address.slice(-4)}`
      );
    }

    if (!isMetaMaskInstalled) {
      return React.createElement(
        'a',
        {
          className: 'button is-primary',
          href: 'https://metamask.io/download.html',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        'Install MetaMask'
      );
    }

    return React.createElement(
      'button',
      {
        className: 'button is-primary',
        onClick: () => this.connectWallet()
      },
      'Connect MetaMask'
    );
  }
}


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
                React.createElement('p', { className: 'subtitle is-6' }, `Reply by: ${reply.author}`),
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

  async signAndSubmitReply(content) {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    console.log('Submitting new reply:', { content: this.state.content, postId });

    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask is not installed');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      const timestamp = Math.floor(Date.now() / 1000);
      const message = JSON.stringify({ 'post_id':postId, content, timestamp });
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });

      const response = await fetch('/api/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, signature, address: account, post_id: postId, timestamp }),
      });

      const data = await response.json();
      console.log('Success:', data);
      this.setState({
        content: '',
        preview: ''
      });
      post_this.fetchPost();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();
    // const urlParams = new URLSearchParams(window.location.search);
    // const postId = urlParams.get('id');
    // Here you would typically call your API to create a new reply
    // console.log('Submitting new reply:', { content: this.state.content, postId });
    const { content } = this.state;
    this.signAndSubmitReply(content);

    // Send HTTP POST request using fetch API
    // fetch('/api/reply', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ content: this.state.content, post_id: postId }),
    // })
    // .then(response => response.json())
    // .then(data => {
    //   console.log('Success:', data);
    //   // Reset form after submission
    //   this.setState({
    //     content: '',
    //     preview: ''
    //   });

    //   post_this.fetchPost();
    // })
    // .catch((error) => {
    //   console.error('Error:', error);
    //   // Handle any errors here, such as showing an error message to the user
    // });
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
    this.page2fromtimestamp = {}

    post_list_this = this;
  }

  componentDidMount() {
    this.fetchPosts();
  }

  fetchPosts(page = 1) {
    var url = '/api/list';
    console.log(this.page2fromtimestamp);
    if(page > 1){
      console.log(page);
      const timeline = this.page2fromtimestamp[page];
      url = `/api/list?from_timestamp=${timeline}`;
    // }else{
    //   page = 1;
    }
    fetch(url)
      .then(response => response.json())
      .then(data => {
        this.setState({
          posts: data.posts,
          isLoading: false
        });
        this.page2fromtimestamp[page+1] = data.pagination.next_from_post;
        console.log(this.page2fromtimestamp);
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


class Pagination extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
    };
  }

  handlePageChange = (pageNumber) => {
    if (pageNumber >= 1) {
      this.setState({ currentPage: pageNumber });
      // Here you would typically fetch the data for the new page
      console.log(`Fetching data for page ${pageNumber}`);
    }
    post_list_this.fetchPosts(pageNumber);
  };

  render() {
    const { currentPage } = this.state;

    return React.createElement(
      'nav',
      { className: 'pagination is-right', role: 'navigation', 'aria-label': 'pagination' },
      React.createElement(
        'div',
        { className: 'pagination-list' },
        React.createElement(
          'span',
          { className: 'pagination-current' },
          `Page ${currentPage}`
        ),
        React.createElement(
          'button',
          {
            className: 'button pagination-previous',
            onClick: () => this.handlePageChange(currentPage - 1),
            disabled: currentPage === 1
          },
          'Previous'
        ),
        React.createElement(
          'button',
          {
            className: 'button pagination-next',
            onClick: () => this.handlePageChange(currentPage + 1),
            disabled: false,
          },
          'Next'
        ),
      )
    );
  }
}


class NewPostForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      content: '',
      preview: ''
    };
  }

  async signAndSubmitPost(title, content) {
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask is not installed');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];

      const timestamp = Math.floor(Date.now() / 1000);
      const message = JSON.stringify({ title, content, timestamp });
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account],
      });

      const response = await fetch('/api/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, signature, address: account, timestamp }),
      });

      const data = await response.json();
      console.log('Success:', data);
      this.setState({
        title: '',
        content: '',
        preview: ''
      });
      post_list_this.fetchPosts();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    const { title, content } = this.state;

    this.signAndSubmitPost(title, content);

    // console.log('Submitting new post:', { title, content });
    // fetch('/api/new', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ title, content }),
    // })
    // .then(response => response.json())
    // .then(data => {
    //   console.log('Success:', data);
    //   this.setState({
    //     title: '',
    //     content: '',
    //     preview: ''
    //   });
    //   post_list_this.fetchPosts();
    // })
    // .catch((error) => {
    //   console.error('Error:', error);
    // });
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
    const { title, content, preview } = this.state;

    return React.createElement(
      'div',
      { className: 'new-post-form box' },
      React.createElement('h2', { className: 'title is-3' }, 'Create a New Post'),
      React.createElement(
        'form',
        { onSubmit: this.handleSubmit },
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
              onChange: (e) => this.setState({ title: e.target.value }),
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
              'Submit Post'
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
        React.createElement('div', { dangerouslySetInnerHTML: { __html: preview } })
      )
    );
  }
}


export {
  LoginButton,
  Post,
  ReplyPostForm,
  PostList,
  Pagination,
  NewPostForm,
  post_this,
  reply_this,
};
