/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet
} from 'react-native';
import { Container, Content, ActionSheet, Button, Text, Header, Left, Right, Body, Title } from 'native-base';
import Camera from 'react-native-camera';

export default class iPadApp extends Component {
  render() {
    return (
      <Container>
        <Header>
          <Body>
            <Title>Flight Centre Hackathon</Title>
          </Body>
        </Header>
        
        <Content padder>
          <Text>Hello</Text>  
          <Camera
              ref={(cam) => {
                this.camera = cam;
              }}
              style={styles.container}
              type={Camera.constants.Type.front}>
          </Camera>
          <Button light block onPress={this._takePicture.bind(this)}>
            <Text>Take Picture</Text>
          </Button>
        </Content>
      </Container>
    );
  }

  _takePicture () {
    this.camera.capture()
      .then((data) => console.log(data))
      .catch(err => console.error(err));
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
