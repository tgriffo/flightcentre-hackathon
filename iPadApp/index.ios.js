/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Image
} from 'react-native';
import { Container, Content, ActionSheet, Button, Text, Header, Left, Right, Body, Title } from 'native-base';
import Camera from 'react-native-camera';

export default class iPadApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      debugCamera: "debug camera text",
    };
  }

  render() {
    return (
      <Container>
        <Header>
          <Body>
            <Title>Flight Centre Hackathon</Title>
          </Body>
        </Header>
        
        <Content padder>
          <Camera
              ref={(cam) => {
                this.camera = cam;
              }}
              style={styles.container}
              type={Camera.constants.Type.front}>
          </Camera>
          <Button light block onPress={this.takePicture.bind(this)}>
            <Text>Take Picture</Text>
          </Button>
          <Text>
            {this.state.debugCamera}
          </Text>
          <Image 
            style={{width: 500, height: 500}}
            source={this.state.lastImage}>
          </Image>
        </Content>
      </Container>
    );
  }

  takePicture () {
    this.camera.capture()
      .then((data) => {
        const path = data.path;
        this.setState({ 
          debugCamera: path,
          lastImage: { uri: path } 
        });
      })
      .catch(err => this.setState({ debugCamera: 'capture error: ' + JSON.stringify(err) }));
  }

  uploadPicture() {
         
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  button: {
    padding: 10,
    color: "#FF0000",
    borderWidth: 1,
    borderColor: "#FFFFFF",
		margin: 5
	},
	buttonText: {
	  color: "#000000"
	},
});

AppRegistry.registerComponent('iPadApp', () => iPadApp);
