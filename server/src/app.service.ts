import { Injectable } from '@nestjs/common';
import { Rekognition, config, EnvironmentCredentials } from 'aws-sdk';

@Injectable()
export class AppService {
  rekognition: Rekognition;

  constructor() {
    config.credentials = new EnvironmentCredentials('AWS');
    config.update({
      region: process.env.AWS_DEFAULT_REGION || 'eu-west-1',
    });
    this.rekognition = new Rekognition();
  }

  detectText(params: Rekognition.Types.DetectTextRequest) {
    return this.rekognition
      .detectText(params, (err, data) => {
        if (err) {
          console.log(err);
          return err;
        } else {
          console.log(`Recognized data: ${JSON.stringify(data)}`);
          return data;
        }
      })
      .promise();
  }
}
