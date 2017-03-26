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
        <DeckSwiper
          onSwipeRight={this.swipeRight.bind(this)}
          onSwipeLeft={this.swipeLeft.bind(this)}
          dataSource={this.state.images}
          renderItem={this.renderItem}
        />
      </Container>
    );
  }

  renderItem(item) {
    return (
      <Card style={{ elevation: 3 }}>
        <CardItem cardBody>
          <Image style={styles.holidayImage} source={item.img_src} />
        </CardItem>
        <CardItem>
          <Left>
            <Icon name="ios-arrow-dropleft-circle-outline" style={{ color: '#FF0D49' }} />
          </Left>
          <Right>
            <Icon name="ios-arrow-dropright-circle-outline" style={{ color: '#1DE9B6' }} />
          </Right>
        </CardItem>
      </Card>
    );
  }

  swipeRight() {
    this.swipe(true);
  }

  swipeLeft() {
    this.swipe(false);
  }

  swipe(like) {
    setTimeout(this.takePicture.bind(this), 500);
  }

  takePicture () {
    this.camera.capture()
      .then((data) => {
        const path = data.path;
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
