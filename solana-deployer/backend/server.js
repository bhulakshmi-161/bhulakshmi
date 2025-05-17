import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import  { glob} from 'glob';
import solanaWeb3 from '@solana/web3.js';

const app = express();
const PORT = 3001;

// Ensure uploads folder exists
fs.mkdirSync('./backend/uploads', { recursive: true });

app.use(cors());
app.use(express.json());

// Debug content-type middleware
app.use((req, res, next) => {
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './backend/uploads'),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Upload test route
app.post('/upload-test', upload.single('file'), (req, res) => {
  console.log('File received:', req.file);
  res.json({ fileReceived: !!req.file });
});

// Deploy route
app.post('/deploy', upload.fields([{ name: 'rustFile' }, { name: 'authKey' }]), async (req, res) => {
  try {
    console.log('--- Deploy API called ---');
    console.log('FILES received:', req.files);
    console.log('BODY received:', req.body);

    if (!req.files || !req.files['rustFile'] || !req.files['authKey']) {
      return res.status(400).json({ error: 'Required files missing' });
    }

    const rustFilePath = req.files['rustFile'][0].path;
    const authKeyPath = req.files['authKey'][0].path;
    const network = req.body.network || 'devnet';

    const projectName = `project_${Date.now()}`;
    const projectPath = `./backend/uploads/${projectName}`;
    const srcDir = `${projectPath}/src`;

    // Create project structure
    fs.mkdirSync(srcDir, { recursive: true });
    fs.copyFileSync(rustFilePath, `${srcDir}/lib.rs`);
    fs.copyFileSync(authKeyPath, `${projectPath}/auth-keypair.json`);

    // Write Cargo.toml
    const cargoToml = `
[package]
name = "${projectName}"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]

[dependencies]
anchor-lang = "0.29.0"
    `;
    fs.writeFileSync(`${projectPath}/Cargo.toml`, cargoToml.trim());

    // Write Anchor.toml
    const anchorToml = `
[programs.${network}]


[registry]
url = "https://api.${network}.solana.com"

[provider]
cluster = "${network}"
wallet = "${path.resolve(projectPath, 'auth-keypair.json')}"

[scripts]
    `;
    fs.writeFileSync(`${projectPath}/Anchor.toml`, anchorToml.trim());

    // Build and deploy commands
    const anchorBuildCmd = `/home/bhulakshmi-ravuri/.cargo/bin/anchor build`;
    const anchorDeployCmd = `/home/bhulakshmi-ravuri/.cargo/bin/anchor deploy --provider.cluster ${network} --provider.wallet ${path.resolve(projectPath, 'auth-keypair.json')}`;

    // Build
    exec(`cd ${projectPath} && ${anchorBuildCmd}`, (buildErr, buildStdout, buildStderr) => {
      if (buildErr) {
        console.error('Build error:', buildStderr);
        return res.status(500).json({ error: `Build failed: ${buildStderr}` });
      }
      console.log('Build succeeded:', buildStdout);

      // Deploy
      exec(`cd ${projectPath} && ${anchorDeployCmd}`, (deployErr, deployStdout, deployStderr) => {
        if (deployErr) {
          console.error('Deploy error:', deployStderr);
          return res.status(500).json({ error: `Deploy failed: ${deployStderr}` });
        }
        console.log('Deploy succeeded:', deployStdout);

        // Extract program ID from generated keypair file
        const programKeypairPath = path.resolve(projectPath, 'target', 'deploy', `${projectName}-keypair.json`);
        console.log("the programKeypairPath is", programKeypairPath);

        const deployDir = path.join(projectPath, 'target', 'deploy');

// Search for any `*-keypair.json` file inside target/deploy
const keypairFiles = glob.sync(path.join(deployDir, '*-keypair.json'));

        if (keypairFiles.length > 0) {
          const programKeypairPath = keypairFiles[0]; // take the first matching file
          console.log("Program keypair JSON found at:", programKeypairPath);
        
          const keypairData = JSON.parse(fs.readFileSync(programKeypairPath, 'utf8'));
          const secretKey = Uint8Array.from(keypairData);
          const keypair = solanaWeb3.Keypair.fromSecretKey(secretKey);
          const programId = keypair.publicKey.toBase58();
        
          console.log("The program ID is", programId);
        
          res.json({
            message: 'Program deployed successfully',
            programId,
            buildOutput: buildStdout,
            deployOutput: deployStdout,
          });
        } else {
          console.log("No program keypair JSON file found inside:", deployDir);
          res.json({
            message: 'Program deployed successfully, but program keypair JSON not found',
            programId: 'Unknown',
            buildOutput: buildStdout,
            deployOutput: deployStdout,
          });
        }
        
      });
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
