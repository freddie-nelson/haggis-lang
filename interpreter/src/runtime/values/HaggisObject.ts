import HaggisClass from "./HaggisClass";
import HaggisClassInstance from "./HaggisClassInstance";
import HaggisRecord from "./HaggisRecord";
import HaggisRecordInstance from "./HaggisRecordInstance";

type HaggisObject = HaggisRecord | HaggisClass;
type HaggisInstance = HaggisRecordInstance | HaggisClassInstance;

export { HaggisObject, HaggisInstance };
