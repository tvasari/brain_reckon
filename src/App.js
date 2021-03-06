import React, { Component } from 'react';
import './App.css';
import Particles from 'react-particles-js';
import Navigation from './components/Navigation/Navigation.js';
import Logo from './components/Logo/Logo.js';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm.js';
import Rank from './components/Rank/Rank.js';
import FaceRecognition from './components/FaceRecognition/FaceRecognition.js';
import Signin from './components/Signin/Signin.js';
import Register from './components/Register/Register.js';

const particlesOptions = {
                particles: {
                  number: {
                    value: 60,
                    density: {
                      enable: true,
                      value_area: 300
                    }
                  }
                }
              }


const initialState = {
      input: '',
      imageUrl: '',
      box: {},
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: new Date()
      }
    }

class App extends Component {

  constructor() {
    super();
    this.state = initialState;
    this.logout = this.logout.bind(this);
    this.resetTimeout = this.resetTimeout.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.route !== prevState.route && this.state.route === 'home') {
      this.events = ['load', 'mousemove', 'mousedown',
      'click', 'scroll', 'keypress'];
      this.events.forEach((event) => {
        window.addEventListener(event, this.resetTimeout);
      });
      
      this.setTimeout();
    }
  }

  displayFaceBox = (box) => {
    this.setState({box: box})
  }

  loadUser = (data) => {
    this.setState({user :{
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
    }})
  }

  calculateFaceLocation = (data) => {
      const clariFace = data.outputs[0].data.regions[0].region_info.bounding_box;
      const image = document.getElementById('inputimage');
      const width = Number(image.width);
      const height = Number(image.height);

      return {
        leftCol: clariFace.left_col * width,
        topRow: clariFace.top_row * height,
        rightCol: width - (clariFace.right_col * width ),
        bottomRow: height - (clariFace.bottom_row * height ),
      }
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {

    this.setState({imageUrl: this.state.input})
    fetch('https://brain-rekon-api.herokuapp.com/imageurl', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        input: this.state.input
      })
    })
    .then(response => response.json()) 
    .then(response => {
      if (response) {
        fetch('https://brain-rekon-api.herokuapp.com/image', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: this.state.user.id
          })
        })
        .then(response => response.json())
        .then(count => {
          this.setState(Object.assign(this.state.user, {entries: count}))
        })
        .catch(console.log)

      }
      this.displayFaceBox(this.calculateFaceLocation(response))
    })
    .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    this.setState({route: route});

    if (route === 'signout') {
      this.setState(initialState); //difference {route: 'signin', isSignedIn: false}
    } else if (route === 'home') {
      this.setState({isSignedIn: true});
    }
  }

  clearTimeout() {
    if(this.warnTimeout)
      clearTimeout(this.warnTimeout);

    if(this.logoutTimeout)
      clearTimeout(this.logoutTimeout);
  }

  setTimeout() {
    this.warnTimeout = setTimeout(() => alert('logging out in 1 minute'), 8 * 30 * 1000)
    this.logoutTimeout = setTimeout(this.logout, 10 * 30 * 1000);
  }

  resetTimeout() {
    this.clearTimeout();
    this.setTimeout();
  }

  logout() {
    this.setState({route: 'signin', isSignedIn: false});
    this.destroy();
  }

  destroy() {
    this.clearTimeout();

    this.events.forEach((event) => {
      window.removeEventListener(event, this.resetTimeout);
    });
  }


  render() {

    const { isSignedIn, box, imageUrl, route } = this.state;
    
    return (
      <div className="App">
          <Particles params={particlesOptions} className='particles' />
          <Navigation isSignedIn={isSignedIn} onRouteChange={this.onRouteChange}  />
        { route === 'home'  
          ? <div>
              <Logo />
              <h1>Brain Rekon</h1>
              <Rank name={this.state.user.name} entries={this.state.user.entries}/>
              <ImageLinkForm 
                onInputChange={this.onInputChange}
                onButtonSubmit={this.onButtonSubmit}
              />
              <FaceRecognition box={box} imageUrl={imageUrl}/>
            </div>
          : ( route === 'signin' || route === 'signout'
            ? <Signin loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>
            : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange}/>  
          )
        }
      </div>
    );
  }
}

export default App;
