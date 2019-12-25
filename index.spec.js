const { generateRequestId, decodeRequestId, symmetricallyEncryptBuffer, symmetricallyDecryptBuffer } = require('./');
const crypto = require('crypto');

describe('symmetric encryption', () => {
    const iv = crypto.randomBytes(32);
    it('should actually be symmetric w/ strings', () => {
        expect(symmetricallyDecryptBuffer(
            symmetricallyEncryptBuffer(Buffer.from('test', 'utf8'), iv),
            iv
        )).toEqual(Buffer.from('test', 'utf8'));
    });

    it('should actually be symmetric w/ buffers', () => {
        expect(symmetricallyDecryptBuffer(
            symmetricallyEncryptBuffer(new Buffer([255]), iv),
            iv
        )).toEqual(new Buffer([255]));
    });
});

describe('request ids', () => {
    const epochSeconds = 1577257801;
    const ipv4Array = '255.255.255.255'.split('.').map(x => x*1);
    const obj = { epochSeconds, ipv4Array };

    it.only('should be symmetric', async () => {
        expect(decodeRequestId(await generateRequestId(obj))).toMatchObject(obj);
    });

    it('should be opaque when generated', async () => {
        const reqId = await generateRequestId(obj);
        // expect(reqId).toMatch(/^[a-zA-Z0-9]+$/);
    });
});
