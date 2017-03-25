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

import { RNS3 } from 'react-native-aws3';

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
        this.uploadPicture(path);
      })
      .catch(err => this.setState({ debugCamera: 'capture error: ' + JSON.stringify(err) }));
  }

  uploadPicture(path) {
    //const parsedUrl = URL.parse(path);
    //const name = parsedUrl.query.substring(3,parsedUrl.query.length-8);
    //const type = 'image/' + parsedUrl.query.substring(parsedUrl.query.length-3);
    const file = {
      uri: path,
      name: 'HELLO.jpg',
      type: 'image/JPG'
    };
    const options = {
      //keyPrefix: './',
      bucket: 'flightcentre-hackathon-os-piratas',
      region: 'ap-southeast-2',
      accessKey: 'AKIAJQ3M4OYQX6UJ227A',
      secretKey: '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',
      successActionStatus: 201
    };
    RNS3.put(file, options)
      .then(response => {
        const imageCloudPath = response.body.postResponse.location;
        this.setState({ 
          debugCamera: imageCloudPath,
          lastImage: { uri: imageCloudPath }
        });
        this.verifyEmotion(imageCloudPath);
      })
      .catch(err => this.setState({ debugCamera: 'upload error: ' + JSON.stringify(err) }));
  }
  
  verifyEmotion(imageCloudPath) {
    const body = { url: imageCloudPath };
    const myHeaders = new Headers({
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': 'f07f680a18e94bd4a68a2f72884522bf'
    });
    const options = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(body)
    };
    const myRequest = new Request('https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize', options);
    fetch(myRequest)
    .then(response => {
      return response.text();
    })
    .then(blob => {
      this.setState({ debugCamera: blob });
    });
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
