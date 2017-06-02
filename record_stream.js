/**
 * Created by bb on 5/29/2017.
 */

'use strict';

const record = require('node-record-lpcm16');
var Speech = require('@google-cloud/speech');  // Imports the Google Cloud client library
var fs = require('fs');

var speech = Speech({
    projectId: 'bahasavoice',
    keyFilename: 'credentials/bahasavoice.json'
});

var translate = require('@google-cloud/translate')({
    projectId: 'bahasavoice',
    keyFilename: 'credentials/bahasavoice.json'
});


/** Set const for recording.*/
const encoding = 'LINEAR16';  // The encoding of the audio file
const sampleRateHertz = 16000;  // The sample rate of the audio file in hertz
// var languageCode = 'en-US';  // The BCP-47 language code to sue
// var language_type = 'en';

/** define the functions for translate*/
function detect_lang(text, callback) {
    translate.detect(text, function (err, results) {
        if (!err) {
            callback(null, results);
        }
        else {
            callback(err);
        }
    });
}

// Translate language
function translate_lang(text, type, callback) {
    translate.translate(text, type, function (err, translation) {
        if (!err) {
            callback(null, translation);
        }
        else {
            callback(err)
        }

    })
}

function streaming_speech(languageCode) {
    try {
        /** Converting text from streaming voice using google cloud speech api.*/
        
        var language_type = languageCode.toString().split('-')[0];
        var request = {
            config: {
                encoding: encoding,
                sampleRateHertz: sampleRateHertz,
                languageCode: languageCode
            },
            interimResults: false // If you want interim results, set this to true
        };

        // Create a recognize stream.
        var recognizeStream = speech.createRecognizeStream(request)
            .on('error', (err) => {
                console.log('Speech API ERROR: ' + error)
            })
            .on('data', (data) => {

                var transcription = data.results;

                console.log(`Transcription: ${transcription}`);

                translate_lang(transcription, language_type, (err, result) => {
                    if (err)
                        console.log('Translation Error ' + err);
                    else {
                        console.log('Language: ' + language_type);
                        console.log('Translation Result: ' + result)
                    }
                })

            });
        // fs.createReadStream('audio2.raw').pipe(recognizeStream);
        /** Start recording and send the microphone input to the Speech API.*/
        record
            .start({
                sampleRateHertz: sampleRateHertz,
                threshold: 0,
                verbose: false,
                recordProgram: 'arecord',
                silence: '10.0'

            })
            .on('error', console.error)
            .pipe(recognizeStream);
    }
    catch (e){
        console.log('error ' + e);
    }
}

const cli = require(`yargs`)
    .demand(1)
    .command(
        `listen`,
        `Detects speech in a microphone input stream.`,
        {},
        (opts) => streaming_speech(opts.languageCode)
    )
    .options({
        languageCode: {
            alias: 'l',
            default: 'en-US',
            global: true,
            requiresArg: true,
            type: 'string'
        }
    })
    .example(`node $0 listen -l en-US`)
    .usage('Check support_language.json in credentials folder.')
    .wrap(120)
    .recommendCommands()
    .help('help')
    .locale('pirate')
    .strict();

if (module === require.main) {
    console.log('Listening.....');
        cli.parse(process.argv.slice(2));
 
}
