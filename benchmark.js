const r = require('restructure');
const { factory } = require('.');

const RequestId = new r.VersionedStruct(r.uint8, {
    0: {
        epochSeconds: r.int32,
        ipv4Array: new r.Array(r.uint8, 4),
    },
});

const { generateRequestId, decodeRequestId } = factory(RequestId, 'this-is-my-encryption-key');

const Benchmark = require('benchmark');
const suite = new Benchmark.Suite('requestId work', {
  onCycle: (event) => console.log(String(event.target)),
});

const timeInSeconds = () => Math.floor(Date.now() / 1000);

const requestIds = [];

suite
  .add('generating request ids', async () => {
    requestIds.push(await generateRequestId({ version: 0, epochSeconds: '' + timeInSeconds, ipv4Array: [127, 0, 0, 1] }));
  })
  .add('decoding request ids', () => {
    var randomRequestId = requestIds[Math.floor(Math.random() * requestIds.length)];
    return decodeRequestId(randomRequestId);
  })
  .run({ 'async': true })
;


