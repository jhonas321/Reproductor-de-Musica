import { registerWebModule, NativeModule } from 'expo';

class HmusicMediaStoreModule extends NativeModule<{}> {}

export default registerWebModule(HmusicMediaStoreModule, 'HmusicMediaStoreModule');
