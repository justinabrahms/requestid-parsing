# RequestId parsing
This is a utility to generate request ids for requests coming into a web application.

```
// define the request id structure
const RequestId = new r.VersionedStruct(r.uint8, {
    0: {
        epochSeconds: r.int32,
        ipv4Array: new r.Array(r.uint8, 4),
    },
});

const reqId = await generateRequestId(RequestId, encryptionKey, obj);
console.log(reqId);
// prints: u3qksESXhGASO3MKTs06rDUt15Ov1YtYnp/UnuepjuU=
```

## Why not just use a uuid?
We cannot encode data into a UUID. We may want to, for instance,
encode information like which server was contacted, the timestamp, the
version of the software running, or any other information. This allows
us to better pin-point problems if clients contact us with issues for
their requests.

## Why is it so big?
It's currently so large due to using initialization vectors (aka
nonces). This adds additional 16 bytes to our key, which does bloat
the generated request id by over 100% for the RequestId type shown
above (~12 bytes to 12+16= 28 bytes).
