const r = require('restructure');
const crypto = require('crypto');
const concat = require('concat-stream');

const encryptionScheme = 'aes-256-cbc';
const ivKeySize = 16;
const keySize = 32;

const factory = exports.factory = (struct, key) => {
    return {
        generateRequestId: generateRequestId.bind(undefined, struct, key),
        decodeRequestId: decodeRequestId.bind(undefined, struct, key),
    };
};

const symmetricallyEncryptBuffer = exports.symmetricallyEncryptBuffer = (encryptionKey, iv, buffer) => {
    const encryptionKeyPadded = encryptionKey.padEnd(keySize, '=').slice(0, keySize);
    const cipher = crypto.createCipheriv(encryptionScheme, encryptionKeyPadded, iv);
    return Buffer.concat([cipher.update(buffer), cipher.final()]);
};

const generateRequestId = exports.generateRequestId = (struct, encryptionKey, payload) => {
    return new Promise((resolve, reject) => {
        const stream = new r.EncodeStream;
        const iv = Buffer.from(crypto.randomBytes(ivKeySize));

        stream.pipe(concat((buf) => {
            return resolve(Buffer.concat([iv, symmetricallyEncryptBuffer(encryptionKey, iv, buf)]).toString('base64'));
        }));

        struct.encode(stream, payload);
        stream.once('error', reject);

        return stream.end();
    });
};

const symmetricallyDecryptBuffer = exports.symmetricallyDecryptBuffer = (encryptionKey, iv, buffer) => {
    const encryptionKeyPadded = encryptionKey.padEnd(keySize, '=').slice(0, keySize);
    const decipher = crypto.createDecipheriv(encryptionScheme, encryptionKeyPadded, iv);
    return Buffer.concat([decipher.update(buffer), decipher.final()]);
};

const decodeRequestId = exports.decodeRequestId = (struct, encryptionKey, requestId) => {
    const buffer = Buffer.from(requestId, 'base64');

    const iv = buffer.slice(0, ivKeySize);
    const rest = buffer.slice(ivKeySize);

    const deciphered = symmetricallyDecryptBuffer(encryptionKey, iv, Buffer.from(rest, 'base64'));
    const stream = new r.DecodeStream(Buffer.from(deciphered));
    return struct.decode(stream);
};
