// testApp.js
async function initTestApp() {
  const app = express();
  
  // Start in-memory MongoDB (no auth)
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Connect without any auth options
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Rest of your app setup
  app.use(cors());
  app.use(express.json());
  const routes = require('../routes');
  app.use('/', routes);
  
  return app;
}
