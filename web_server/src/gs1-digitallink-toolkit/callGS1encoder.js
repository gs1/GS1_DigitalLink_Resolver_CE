import {GS1encoder} from "gs1encoder";

const gs1encoder = new GS1encoder();
await gs1encoder.init();
try
{
    gs1encoder.aiDataStr = process.argv[2] ? process.argv[2] : "(01)09521234543213(99)TESTING123";
}
catch (e)
{
    console.log("Error: %s", e.message);
    gs1encoder.free();
    process.exit(1);
}
gs1encoder.aiDataStr = process.argv[2] ? process.argv[2] : "(01)09521234543213(99)TESTING123";
console.log("%s", gs1encoder.getDLuri(null));

gs1encoder.free();