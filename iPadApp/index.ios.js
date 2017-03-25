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
import { Container, Content, ActionSheet, Button, Text, Header, Left, Right, Body, Title, Grid, Row, Col } from 'native-base';
import Camera from 'react-native-camera';
import { RNS3 } from 'react-native-aws3';
import * as firebase from 'firebase';
import uuidV1 from 'uuid/v1';

var config = {
    apiKey: "AIzaSyCofSPydjsp_jXp0iGZD60ENQ245_aYbAQ",
    authDomain: "flightcentre-hackathon.firebaseapp.com",
    databaseURL: "https://flightcentre-hackathon.firebaseio.com",
    storageBucket: "flightcentre-hackathon.appspot.com",
};
firebase.initializeApp(config);

// Get a reference to the database service
let database = firebase.database();

export default class iPadApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      debugCamera: "debug camera text",
      pie: {
        data: null,
        options: null
      }
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

        <Content>
          <Grid>
            <Row size={30} style={{ backgroundColor: '#EEEEEE'}}>
              <Content padder>
                <Camera
                    ref={(cam) => {
                      this.camera = cam;
                    }}
                    style={{height: 0}}
                    type={Camera.constants.Type.front}>
                </Camera>
                <Button light block onPress={this.takePicture.bind(this)}>
                  <Text>Take Picture</Text>
                </Button>
                <Text>
                  {this.state.debugCamera}
                </Text>
              </Content>
            </Row>
            <Row size={70}>
              <Image
                style={{width: 500, height: 500}}
                source={this.state.lastImage}>
              </Image>
            </Row>
          </Grid>
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
    const id = uuidV1();
    const file = {
      uri: path,
      name: id + '.jpg',
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
        this.verifyEmotion(imageCloudPath, id);
      })
      .catch(err => this.setState({ debugCamera: 'upload error: ' + JSON.stringify(err) }));
  }

  verifyEmotion(imageCloudPath, id) {
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
    .then(text => {
      const emotions = JSON.parse(text);
      const transposedEmotions = this.transposeEmotions(emotions);
      this.setState({
        debugCamera: JSON.stringify(transposedEmotions),
      });

      database.ref('session/' + id).set({
        emotion: emotions,
        transposedEmotions: transposedEmotions,
        category: 'category 1',
        subcategory: 'subcategory 1',
        country: 'AU',
        city: 'Brisbane',
        imageUrl: imageCloudPath
      });
    });
  }

  transposeEmotions(emotions) {
    if (emotions['0'] && emotions['0'].scores) {
      let arrayOfEmotions = [];

      for (var emotionName in emotions['0'].scores) {
        arrayOfEmotions.push({
          emotion: emotionName,
          value: emotions['0'].scores[emotionName]
        });
      }

      return arrayOfEmotions;
    }

    return [];
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
