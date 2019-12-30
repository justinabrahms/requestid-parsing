const r = require('restructure');
const crypto = require('crypto');
const concat = require('concat-stream');

const encryptionScheme = 'aes256';
const ivKeySize = 16;
const keySize = 32;

const factory = exports.factory = (struct, key) => {
    return {
        generateRequestId: generateRequestId.bind(undefined, struct, key),
        decodeRequestId: decodeRequestId.bind(undefined, struct, key),
    };
};

const generateRequestId = exports.generateRequestId = (struct, encryptionKey, payload) => {
    return new Promise((resolve, reject) => {
        const stream = new r.EncodeStream;
        const iv = Buffer.from(crypto.randomBytes(ivKeySize));

        stream.pipe(concat(function(buf) {
            return resolve(Buffer.concat([iv,symmetricallyEncryptBuffer(buf, encryptionKey, iv)]).toString('base64'));
        }));

        struct.encode(stream, payload);

        return stream.end();
    });
};

const symmetricallyEncryptBuffer = exports.symmetricallyEncryptBuffer = (buffer, encryptionKey, iv) => {
    encryptionKey = encryptionKey.padEnd(keySize, '=').slice(0, keySize);
    const cipher = crypto.createCipheriv(encryptionScheme, encryptionKey, iv);
    return Buffer.concat([cipher.update(buffer), cipher.final()]);
};

const symmetricallyDecryptBuffer = exports.symmetricallyDecryptBuffer = (buffer, encryptionKey, iv) => {
    encryptionKey = encryptionKey.padEnd(keySize, '=').slice(0, keySize);
    const decipher = crypto.createDecipheriv(encryptionScheme, encryptionKey, iv);
    return Buffer.concat([decipher.update(buffer), decipher.final()]);
};

const decodeRequestId = exports.decodeRequestId = (struct, encryptionKey, requestId) => {
    const buffer = Buffer.from(requestId, 'base64');
    
    const iv = buffer.slice(0, ivKeySize);
    const rest = buffer.slice(ivKeySize);
    
    const deciphered = symmetricallyDecryptBuffer(Buffer.from(rest, 'base64'), encryptionKey, iv);
    const stream = new r.DecodeStream(Buffer.from(deciphered));
    return struct.decode(stream);
};
