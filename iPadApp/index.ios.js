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

import config from './config';

firebase.initializeApp(config.firebase);
let database = firebase.database();

export default class iPadApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      debugCamera: '',
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

    RNS3.put(file, config.s3)
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
        'Ocp-Apim-Subscription-Key': config.emotionApi.key
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
});

AppRegistry.registerComponent('iPadApp', () => iPadApp);
