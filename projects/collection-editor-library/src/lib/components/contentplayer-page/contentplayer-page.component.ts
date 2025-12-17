import { Component, ElementRef, Input, OnInit, ViewChild, OnChanges, ViewEncapsulation, AfterViewInit } from '@angular/core';
import * as _ from 'lodash-es';
import { EditorService } from '../../services/editor/editor.service';
import { PlayerService } from '../../services/player/player.service';
import { ConfigService } from '../../services/config/config.service';
import { forkJoin } from 'rxjs';
declare var $: any;

@Component({
  selector: 'lib-contentplayer-page',
  templateUrl: './contentplayer-page.component.html',
  styleUrls: ['./contentplayer-page.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ContentplayerPageComponent implements OnInit, OnChanges {
  @ViewChild('contentIframe') contentIframe: ElementRef;
  @ViewChild("pdfPlayer") pdfPlayer: ElementRef;
  @ViewChild("epubPlayer") epubPlayer: ElementRef;
  @ViewChild("videoPlayer") videoPlayer: ElementRef;
  @ViewChild("qumlPlayer") qumlPlayer: ElementRef;
  @Input() contentMetadata: any;
  @Input() contentDataConfig: any;
  public contentDetails: any;
  public playerConfig: any;
  public content: any;
  public playerType: string;
  public contentId: string;
  public qumlPlayerConfig: any;
  public showQumlPlayer = false;
  constructor(private editorService: EditorService, private playerService: PlayerService,
    public configService: ConfigService) { }

  ngOnInit() { }

  ngOnChanges() {
    this.contentMetadata = _.get(this.contentMetadata, 'data.metadata') || this.contentMetadata;
    if (this.contentId !== this.contentMetadata.identifier) {
      this.contentId = this.contentMetadata.identifier;
      this.getContentDetails();
    }
  }

  getContentDetails() {
    this.playerType = 'default-player';
    this.editorService.fetchContentDetails(this.contentId).subscribe(res => {
      this.contentDetails = {
        contentId: this.contentId,
        contentData: _.get(res, 'result.content')
      };
      this.playerConfig = this.playerService.getPlayerConfig(this.contentDetails);
      this.setPlayerType();
      if (this.playerType === 'default-player') {
        this.loadDefaultPlayer()
      } else if (this.playerType === 'quml-player') {
        this.loadQumlPlayer();
      } else {
        this.playerConfig.config = {
          'traceId': 'afhjgh',
          'sideMenu': {
            'showDownload': true,
            'showExit': true,
            'showPrint': true,
            'showReplay': true,
            'showShare': true
          }
        };
        this.loadPlayer()
      }
    }, (error) => {
      console.error('Error fetching content details:', error);
      // If content API fails, try questionset API for QUML content
      this.tryQuestionSetApis();
    });
  }

  tryQuestionSetApis() {
    // Try fetching as QuestionSet if content API fails
    this.editorService.fetchQuestionSetDetails(this.contentId).subscribe(res => {
      this.contentDetails = {
        contentId: this.contentId,
        contentData: _.get(res, 'result.questionset')
      };
      this.playerConfig = this.playerService.getPlayerConfig(this.contentDetails);
      this.setPlayerType();
      if (this.playerType === 'quml-player') {
        this.loadQumlPlayer();
      }
    }, (error) => {
      console.error('Error fetching questionset details:', error);
    });
  }

  setPlayerType() {
    const playerType = _.get(this.configService.playerConfig, 'playerType');
    console.log("playerType ===>", playerType);
    _.forIn(playerType, (value, key) => {
      if (value.length) {
        if (_.includes(value, _.get(this.contentDetails, 'contentData.mimeType'))) {
          this.playerType = key;
        }
      }
    });
  }

  loadDefaultPlayer() {
    // const iFrameSrc = this.configService.appConfig.PLAYER_CONFIG.baseURL + '&build_number=' + this.buildNumber;
    const iFrameSrc = `/content/preview/preview.html?webview=true&build_number=2.8.0.e552fcd`;
    setTimeout(() => {
      const playerElement = this.contentIframe.nativeElement;
      playerElement.src = iFrameSrc;
      playerElement.onload = (event) => {
        try {
          this.adjustPlayerHeight();
          // this.playerLoaded = true;
          playerElement.contentWindow.initializePreview(this.playerConfig);
          // playerElement.addEventListener('renderer:telemetry:event', telemetryEvent => this.generateContentReadEvent(telemetryEvent));
          // window.frames['contentPlayer'].addEventListener('message', accessEvent => this.generateScoreSubmitEvent(accessEvent), false);
        } catch (err) {
          console.log('loading default player failed', err);
          // const prevUrls = this.navigationHelperService.history;
          // if (this.isCdnWorking.toLowerCase() === 'yes' && prevUrls[prevUrls.length - 2]) {
          //   history.back();
          // }
        }
      };
    }, 0);
  }

  /**
   * Adjust player height after load
   */
  adjustPlayerHeight() {
    const playerWidth = $('#contentPlayer').width();
    if (playerWidth) {
      const height = playerWidth * (9 / 16);
      $('#contentPlayer').css('height', height + 'px');
    }
  }

  eventHandler(e) { }

  generateContentReadEvent(e, state?) { }

  setPlayerProperties(playerElement: any) {
    playerElement.setAttribute('player-config', JSON.stringify(this.playerConfig));
    playerElement.addEventListener('playerEvent', this.eventHandler);
    playerElement.addEventListener('telemetryEvent', this.generateContentReadEvent);
  }

  loadPlayer() {
    setTimeout(() => {
      if (this.playerType === "pdf-player") {
        const pdfElement = document.createElement('sunbird-pdf-player');
        this.setPlayerProperties(pdfElement)
        this.pdfPlayer.nativeElement.append(pdfElement);
      } else if (this.playerType === "epub-player") {
        const epubElement = document.createElement('sunbird-epub-player');
        this.setPlayerProperties(epubElement)
        this.epubPlayer.nativeElement.append(epubElement);
      }else if (this.playerType === "video-player") {
        const videoElement = document.createElement('sunbird-video-player');
        this.setPlayerProperties(videoElement)
        this.videoPlayer.nativeElement.append(videoElement);
      }
    }, 500)
  }

  loadQumlPlayer() {
    console.log('Loading QUML Player for content ID:', this.contentId);
    
    // Make both API calls in parallel
    // 1. questionset/v2/read - for metadata including instructions and outcomeDeclaration
    // 2. questionset/v2/hierarchy - for complete hierarchy structure
    forkJoin({
      details: this.editorService.fetchQuestionSetDetails(this.contentId),
      hierarchy: this.editorService.fetchQuestionSetHierarchy(this.contentId)
    }).subscribe(
      (responses) => {
        console.log('QuestionSet Details API Response:', responses.details);
        console.log('QuestionSet Hierarchy API Response:', responses.hierarchy);
        
        // Extract data from both APIs - both use lowercase 'questionset'
        const questionSetDetails = _.get(responses.details, 'result.questionset');
        const questionSetHierarchy = _.get(responses.hierarchy, 'result.questionset');
        
        console.log('Extracted details data:', questionSetDetails);
        console.log('Extracted hierarchy data:', questionSetHierarchy);
        
        if (questionSetHierarchy && questionSetDetails) {
          // Add instructions and outcomeDeclaration from details API to hierarchy response
          const combinedData = {
            ...questionSetHierarchy,  // Base hierarchy structure (complete with children, etc.)
            instructions: questionSetDetails.instructions,  // Add instructions from details
            outcomeDeclaration: questionSetDetails.outcomeDeclaration  // Add outcomeDeclaration from details
          };
          
          console.log('Combined questionSet data:', combinedData);
          
          this.setQumlPlayerConfig(combinedData);
          this.showQumlPlayer = true;
          console.log('QUML Player should now be visible');
        } else {
          console.error('Failed to load question set data');
          if (!questionSetHierarchy) {
            console.error('No hierarchy data. Available keys in hierarchy result:', responses.hierarchy?.result ? Object.keys(responses.hierarchy.result) : 'No result object');
          }
          if (!questionSetDetails) {
            console.error('No details data. Available keys in details result:', responses.details?.result ? Object.keys(responses.details.result) : 'No result object');
          }
        }
      },
      (error) => {
        console.error('Error fetching question set data:', error);
      }
    );
  }

  setQumlPlayerConfig(questionSetData: any) {
    console.log('Setting QUML Player Config with data:', questionSetData);
    
    const playerConfig = _.cloneDeep(this.playerService.getQumlPlayerConfig());
    console.log('Base player config from service:', playerConfig);
    
    this.qumlPlayerConfig = playerConfig;
    
    // Set threshold from config
    this.qumlPlayerConfig.context.threshold = _.get(this.configService, 'playerConfig.threshold') || 1;
    
    // Set metadata from QuestionSet read API response
    // Player will fetch children/questions using the list API internally
    this.qumlPlayerConfig.metadata = _.cloneDeep(questionSetData);
    
    if (this.qumlPlayerConfig.metadata) {
      // Filter out .img nodes from childNodes if present
      if (this.qumlPlayerConfig.metadata.childNodes) {
        let childNodes = this.qumlPlayerConfig.metadata.childNodes;
        childNodes = _.filter(childNodes, (identifier) => !_.endsWith(identifier, '.img'));
        this.qumlPlayerConfig.metadata.childNodes = childNodes;
      }
      
      // Set level if not present
      if (!this.qumlPlayerConfig.metadata.level) {
        this.qumlPlayerConfig.metadata.level = 1;
      }
    }
    
    // Ensure data property exists (empty as player will populate)
    this.qumlPlayerConfig.data = this.qumlPlayerConfig.data || {};
    
    console.log('Final QUML Player Config:', this.qumlPlayerConfig);
  }

  getQumlPlayerEvents(event: any) {
    console.log('QUML Player Event:', JSON.stringify(event));
    // Handle player events like EXIT, etc.
    if (event.eid === 'EXIT') {
      // Handle exit event
    }
  }

  getQumlTelemetryEvents(event: any) {
    console.log('QUML Telemetry Event:', JSON.stringify(event));
    // Handle telemetry events
  }

  getColumnClass(index: number): string {
    console.log("index ===>", index);
    if (index % 3 === 0) {
      return 'six wide column';
    } else if (index % 3 === 1) {
      return 'four wide column';
    } else {
      return 'two wide column';
    }
  }
}
