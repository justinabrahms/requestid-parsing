const r = require('restructure');
const crypto = require('crypto');
const concat = require('concat-stream');


const RequestId = new r.VersionedStruct(r.uint8, {
    0: {
        epochSeconds: r.int32,
        ipv4Array: new r.Array(r.uint8, 4),
    },
});

const key = 'my test key';
const inputEncoding = 'latin1';
const outputEncoding = 'base64';
const ivKeySize = 32;

exports.generateRequestId = ({ epochSeconds, ipv4Array }) => {
    return new Promise((resolve, reject) => {
        const stream = new r.EncodeStream;
        const iv = crypto.randomBytes(ivKeySize);
        console.log('encode ivlenth: ', iv.length);

        stream.pipe(concat(function(buf) {
            return resolve(symmetricallyEncryptBuffer(Buffer.concat([iv,buf]), iv).toString('base64'));
        }));

        RequestId.encode(stream, {
            version: 0,
            epochSeconds,
            ipv4Array: new Buffer([ 255, 255, 255, 255 ]),
        });

        return stream.end();
    });
};

const symmetricallyEncryptBuffer = exports.symmetricallyEncryptBuffer = (buffer, iv) => {
    console.log('encrypt incoming: ', buffer, iv);
    const cipher = crypto.createCipher('aes256', key, iv);
    return Buffer.concat([cipher.update(buffer), cipher.final()]);
    
};

const symmetricallyDecryptBuffer = exports.symmetricallyDecryptBuffer = (buffer, iv) => {
    console.log('decrypting buffer: ', buffer, iv);
    const decipher = crypto.createDecipher('aes256', key, iv);
    return Buffer.concat([decipher.update(buffer), decipher.final()]);
};

exports.decodeRequestId = (requestId) => {
    console.log('reqid: ', requestId);
    const buffer = Buffer.from(requestId, 'base64');
    console.log('reqid-buffer: ', buffer);
    
    const iv = buffer.slice(0, ivKeySize);
    console.log('decode ivlenth: ', iv.length);
    const rest = buffer.slice(ivKeySize);
    console.log('rest: ', rest);

    const deciphered = symmetricallyDecryptBuffer(Buffer.from(rest, 'base64'), iv);
    // const deciphered = symmetricallyDecryptBuffer(Buffer.from(requestId, 'base64'));
    const stream = new r.DecodeStream(new Buffer(deciphered));
    return RequestId.decode(stream);
};
