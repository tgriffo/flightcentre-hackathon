/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Image,
  View
} from 'react-native';
import { Container, Content, ActionSheet, Button, Text, Header, Left, Right,
         Body, Title, Grid, Row, Col, DeckSwiper, Card, CardItem, Thumbnail, Icon } from 'native-base';
import Camera from 'react-native-camera';
import SwipeCards from 'react-native-swipe-cards';

import { RNS3 } from 'react-native-aws3';
import * as firebase from 'firebase';
import uuidV1 from 'uuid/v1';

import config from './config';
import images from './images';

firebase.initializeApp(config.firebase);
let database = firebase.database();

class HolidayImageRotator extends Component {
  constructor(props) {
    super(props);

    this.state = {
      images: images.images,
      currentImageIndex: 0
    };
  }

  render() {
    return (
      <Container>
        <Camera
          ref={(cam) => {
            this.camera = cam;
          }}
          style={{height: 0}}
          type={Camera.constants.Type.front}>
        </Camera>
        <SwipeCards
          cards={this.state.images}

          renderCard={this.renderItem}
          renderNoMoreCards={() => <Text>No more cards</Text>}

          handleYup={this.yup.bind(this)}
          handleNope={this.nope.bind(this)}

          loop
          smoothTransition
        />
      </Container>
    );
  }

  renderItem(item) {
    return (
      <Image style={styles.holidayImage} source={item.img_src} />
     );
  }

  yup(item) {
    this.swipe(true, item);
  }

  nope(item) {
    this.swipe(false, item);
  }

  swipe(like, item) {
    setTimeout(this.takePicture.bind(this, like, item), 500);
  }

  takePicture(like, item) {
    this.camera.capture()
      .then((data) => {
        const path = data.path;
        this.uploadPicture(path, like, item);
      })
      .catch(err => this.setState({ debugCamera: 'capture error: ' + JSON.stringify(err) }));
  }

  uploadPicture(path, like, item) {
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
        this.verifyEmotion(imageCloudPath, like, item);
      })
      .catch(err => this.setState({ debugCamera: 'upload error: ' + JSON.stringify(err) }));
  }

  verifyEmotion(imageCloudPath, like, item) {
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

      let timestamp = new Date().getTime();
      database.ref('session/' + timestamp).set({
        title: item.title,
        keywords: item.keywords,
        emotion: emotions,
        transposedEmotions: transposedEmotions,
        imageUrl: imageCloudPath,
        liked: like
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


export default class iPadApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      debugCamera: ''
    };
  }

  render() {
    return (
      <Container>
        <Header>
          <Body>
            <Title>Flight Centre Hackathon</Title>
            <Text>
              {this.state.debugCamera}
            </Text>
          </Body>
        </Header>

        <Container>
          <HolidayImageRotator />
        </Container>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  holidayImage: {
    resizeMode: 'cover',
    flex: 1,
    width: 500,
    height: 500
  },
  emotionPhoto: {
    width: 50,
    height: 50
  },
});

AppRegistry.registerComponent('iPadApp', () => iPadApp);
