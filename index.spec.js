const { factory, generateRequestId, decodeRequestId, symmetricallyEncryptBuffer, symmetricallyDecryptBuffer } = require('./');
const crypto = require('crypto');
const r = require('restructure');

const RequestId = new r.VersionedStruct(r.uint8, {
    0: {
        epochSeconds: r.int32,
        ipv4Array: new r.Array(r.uint8, 4),
    },
});

const encryptionKey = 'my test key';

describe.only('symmetric encryption', () => {
    const iv = new Buffer(crypto.randomBytes(16));

    it('should actually be symmetric w/ strings', () => {
        expect(symmetricallyDecryptBuffer(
            symmetricallyEncryptBuffer(Buffer.from('test', 'utf8'), encryptionKey, iv),
            encryptionKey, 
            iv
        )).toEqual(Buffer.from('test', 'utf8'));
    });

    it('should actually be symmetric w/ buffers', () => {
        console.log('iv: ', iv);
        expect(symmetricallyDecryptBuffer(
            symmetricallyEncryptBuffer(new Buffer([255]), encryptionKey, iv),
            encryptionKey, 
            iv
        )).toEqual(new Buffer([255]));
    });
});

describe('request ids', () => {
    const epochSeconds = 1577257801;
    const ipv4Array = '255.255.255.255'.split('.').map(x => x*1);
    const obj = { version: 0, epochSeconds, ipv4Array };

    it('should be symmetric', async () => {
        expect(decodeRequestId(RequestId, encryptionKey, await generateRequestId(RequestId, encryptionKey, obj))).toMatchObject(obj);
    });

    it('should be opaque when generated', async () => {
        const reqId = await generateRequestId(RequestId, encryptionKey, obj);
        console.log(reqId);
        expect(reqId).toMatch(/^[a-zA-Z0-9/=+]+$/);
    });

    it('should not be identical if called with identical data', async () => {
        const reqId1 = await generateRequestId(RequestId, encryptionKey, obj);
        const reqId2 = await generateRequestId(RequestId, encryptionKey, obj);
        console.log('req1: ', reqId1);
        console.log('req2: ', reqId2);
        expect(reqId1).not.toEqual(reqId2);
    });

    describe('factory funciton', () => {
        it("should make it so we don't need to pass in struct and key to underlying functions", async () => {
            const { generateRequestId: gen, decodeRequestId: decode } = factory(RequestId, encryptionKey);
            const reqId = await gen(obj);
            expect(decode(await gen(obj))).toEqual(obj);
        });
    });
});
