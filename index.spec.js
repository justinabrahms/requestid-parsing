const { generateRequestId, decodeRequestId, symmetricallyEncryptBuffer, symmetricDecrypt } = require('./');

describe('symmetric encryption', () => {
    it('should actually be symmetric w/ strings', () => {
        expect(symmetricDecrypt(symmetricallyEncryptBuffer(Buffer.from('test')))).toEqual(Buffer.from('test'));
    });

    it('should actually be symmetric w/ buffers', () => {
        expect(symmetricDecrypt(symmetricallyEncryptBuffer(new Buffer([255])))).toEqual(new Buffer([255]));
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
