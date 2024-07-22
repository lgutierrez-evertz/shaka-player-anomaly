import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import {
  Observable,
  animationFrameScheduler,
  interval,
  map,
  of,
  startWith,
  BehaviorSubject,
} from 'rxjs';
// @ts-ignore
import shaka from 'shaka-player';

@Component({
  selector: 'shaka-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <video #videoPlayer
  width="640"
  [src]="finalBlob | async"
  controls
></video>
<button (click)="surround()">surround</button>
<button (click)="stereo()">stereo</button>
<div *ngIf="levels$ | async as levels">
<div>ch1:{{levels[0]}}</div>
<div>ch2:{{levels[1]}}</div>
<div>ch3:{{levels[2]}}</div>
<div>ch4:{{levels[3]}}</div>
<div>ch5:{{levels[4]}}</div>
<div>ch6:{{levels[5]}}</div>
</div>
  `,
})
export class ShakaPlayerComponent implements AfterViewInit {
  @ViewChild('videoPlayer') videoElementRef?: ElementRef;
  private videoElement?: HTMLMediaElement;
  private manifestUri =
    'https://storage.googleapis.com/shaka-demo-assets/tos-surround/dash.mpd';
  private player: shaka.Player;
  levels$?: Observable<number[]> = of([0, 0, 0, 0, 0, 0]);
  initialised = false;
  message = new BehaviorSubject('');
  finalBlob?: Promise<any>;
  ffmpeg?: FFmpeg;
  canPlay = new BehaviorSubject(false);

  async ngAfterViewInit() {
    this.message.subscribe(val => console.log(val));
    this.loadingffmpeg();
    // this.setupWebAudioPipeline();
  }

  public async surround(): Promise<void> {
    if (!this.initialised) {
      this.initialised = true;
      this.videoElement = this.videoElementRef?.nativeElement;
      this.setupWebAudioPipeline();   
    }

    this.videoElement?.pause();
    const position = this.videoElement?.currentTime;
    try {
      const inputSoundName = 'input_sound.webm';
      const inputVideoName = 'input_video.mp4';
      const soundFile = await fetchFile("https://storage.googleapis.com/shaka-demo-assets/tos-surround/a-eng-0256k-libopus-6c.webm")
      const videoFile = await fetchFile("https://storage.googleapis.com/shaka-demo-assets/tos-surround/v-0144p-0100k-libx264.mp4");
      await this.ffmpeg?.writeFile(inputSoundName, soundFile);
      await this.ffmpeg?.writeFile(inputVideoName, videoFile);
      await this.ffmpeg?.exec([
        '-i',
        inputVideoName,
        '-i',
        inputSoundName,
        // inputSoundName, // Input file
        '-c',
        'copy', // Video codec: H.264
        // '-preset',
        // 'ultrafast', // Preset for faster encoding
        // '-r',
        // '20', // Frame rate: Reduced to 20 FPS
        // '-crf',
        // '28', // Slightly reduced quality for speed
        'output.mp4' // Output file
      ]);
      this.message.next('Conversion completed.');
      this.finalBlob = this.ffmpeg?.readFile('output.mp4').then(data => {
        return URL.createObjectURL(
          new Blob([(data as any).buffer], { type: 'video/mp4' })
        )
      }) as any;

      // console.log(data);
      // console.log(URL.createObjectURL(
      //   new Blob([(data as any).buffer], { type: 'video/mp4' })
      // ))
    } catch (error) {
      console.error(error);
    }

    setTimeout(() => {
      (this.videoElement as any).currentTime = position;
      this.videoElement?.play();
    });
    // setTimeout(() => {
    //   const tracks = this.player.getVariantTracks();
    //   this.player.selectVariantTrack(
    //     // @ts-ignore
    //     tracks.find((t) => t.channelsCount === 6),
    //     true
    //   );
    //   console.log(tracks);
    // }, 1000)
  }

  public async stereo() {
    if (!this.initialised) {
      this.initialised = true;
      this.videoElement = this.videoElementRef?.nativeElement;
      this.setupWebAudioPipeline();   
    }
    this.videoElement?.pause();
    const position = this.videoElement?.currentTime;
    try {
      const inputSoundName = 'input_sound.webm';
      const inputVideoName = 'input_video.mp4';
      const soundFile = await fetchFile("https://storage.googleapis.com/shaka-demo-assets/tos-surround/a-eng-0128k-aac-2c.mp4")
      const videoFile = await fetchFile("https://storage.googleapis.com/shaka-demo-assets/tos-surround/v-0144p-0100k-libx264.mp4");
      await this.ffmpeg?.writeFile(inputSoundName, soundFile);
      await this.ffmpeg?.writeFile(inputVideoName, videoFile);
      await this.ffmpeg?.exec([
        '-i',
        inputVideoName,
        '-i',
        inputSoundName,
        // inputSoundName, // Input file
        '-c',
        'copy', // Video codec: H.264
        // '-preset',
        // 'ultrafast', // Preset for faster encoding
        // '-r',
        // '20', // Frame rate: Reduced to 20 FPS
        // '-crf',
        // '28', // Slightly reduced quality for speed
        'output.mp4' // Output file
      ]);
      this.message.next('Conversion completed.');
      this.finalBlob = this.ffmpeg?.readFile('output.mp4').then(data => {
        return URL.createObjectURL(
          new Blob([(data as any).buffer], { type: 'video/mp4' })
        )
      }) as any;
      
      setTimeout(() => {
        (this.videoElement as any).currentTime = position;
        this.videoElement?.play();
      });


      // console.log(data);
      // console.log(URL.createObjectURL(
      //   new Blob([(data as any).buffer], { type: 'video/mp4' })
      // ))
    } catch (error) {
      console.error(error);
    }

    // const tracks = this.player.getVariantTracks();
    // const test = this.player.selectVariantTrack(
    //   // @ts-ignore
    //   tracks.find((t) => t.channelsCount === 2),
    //   true
    // );

    // console.log(test);
  }

  private async loadingffmpeg(): Promise<void> {
    this.ffmpeg = new FFmpeg();
    this.ffmpeg.on('log', (messageObj: any) => {
      this.message.next(messageObj.message)
    });
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    const config = {
      coreURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript'
      ),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm'
      ),
      classWorkerURL: 'assets/ffmpeg/worker.js'
    };

    await this.ffmpeg?.load(config);
    this.message.next('FFmpeg loaded.');
  }

  private setupWebAudioPipeline(): void {
    const audioContext = new AudioContext();
    const sourceNode = audioContext.createMediaElementSource(
      this.videoElement!
    );
    const audioChannelSplitter = audioContext.createChannelSplitter(6);
    sourceNode.connect(audioChannelSplitter);
    const analysers: AnalyserNode[] = Array(6)
      .fill(null)
      .map((_, i) => {
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = -100;
        analyser.maxDecibels = 0;
        analyser.smoothingTimeConstant = 0.8;
        analyser.fftSize = 32;
        audioChannelSplitter.connect(analyser, i, 0);
        //this is for connecting  the audio back.
        sourceNode.connect(audioContext.destination);
        return analyser;
      });

    const freqData = new Uint8Array(analysers[0].frequencyBinCount);
    this.levels$ = interval(1000 / 60, animationFrameScheduler).pipe(
      startWith([]),
      map(() => {
        return analysers.map((a) => {
          a.getByteFrequencyData(freqData);
          return Math.max(...freqData) / 256;
        });
      })
    );

    audioContext.resume();
  }
}
