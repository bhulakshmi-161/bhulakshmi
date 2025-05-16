import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;

// Ensure uploads folder exists
fs.mkdirSync('./backend/uploads', { recursive: true });

app.use(cors());
app.use(express.json());

// Log Content-Type header for debugging
app.use((req, res, next) => {
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './backend/uploads'),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

app.post('/upload-test', upload.single('file'), (req, res) => {
  console.log('File received:', req.file);
  res.json({ fileReceived: !!req.file });
});

// Updated deploy endpoint
app.post('/deploy', upload.fields([{ name: 'rustFile' }, { name: 'authKey' }]), async (req, res) => {
    try {
      console.log('--- Deploy API called ---');
      console.log('FILES received:', req.files);
      console.log('BODY received:', req.body);
  
      if (!req.files) {
        console.log('No files uploaded');
        return res.status(400).json({ error: 'No files were uploaded' });
      }
      if (!req.files['rustFile'] || req.files['rustFile'].length === 0) {
        console.log('Rust file missing');
        return res.status(400).json({ error: 'Rust file is missing' });
      }
      if (!req.files['authKey'] || req.files['authKey'].length === 0) {
        console.log('Auth key file missing');
        return res.status(400).json({ error: 'Auth key file is missing' });
      }
  
      const rustFilePath = req.files['rustFile'][0].path;
      const authKeyPath = req.files['authKey'][0].path;
      const network = req.body.network || 'devnet';
  
      console.log('Rust file path:', rustFilePath);
      console.log('Auth key file path:', authKeyPath);
      console.log('Target network:', network);
  
      // Create a unique project folder
      const projectName = `project_${Date.now()}`;
      const projectPath = `./backend/uploads/${projectName}`;
      console.log('Creating project directory at:', projectPath);
      fs.mkdirSync(projectPath, { recursive: true });
  
      // Setup src folder for Rust program
      const srcDir = `${projectPath}/programs/${projectName}/src`;
      console.log('Creating src directory at:', srcDir);
      fs.mkdirSync(srcDir, { recursive: true });
  
      // Copy Rust source file
      const destRustFile = `${srcDir}/lib.rs`;
      console.log(`Copying Rust file from ${rustFilePath} to ${destRustFile}`);
      fs.copyFileSync(rustFilePath, destRustFile);
  
      // Copy auth key file to project root (where Anchor.toml expects wallet)
      const destAuthKey = `${projectPath}/auth-keypair.json`;
      console.log(`Copying auth key from ${authKeyPath} to ${destAuthKey}`);
      fs.copyFileSync(authKeyPath, destAuthKey);
  
      // Confirm files exist after copying
      console.log('Checking if files exist after copying...');
      console.log('Rust file exists:', fs.existsSync(destRustFile));
      console.log('Auth key file exists:', fs.existsSync(destAuthKey));
  
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
      const cargoTomlPath = `${projectPath}/programs/${projectName}/Cargo.toml`;
      console.log('Writing Cargo.toml to:', cargoTomlPath);
      fs.writeFileSync(cargoTomlPath, cargoToml);
  
      // Write Anchor.toml
      const anchorToml = `
  [programs.${network}]
  ${projectName} = "11111111111111111111111111111111"
  
  [registry]
  url = "https://api.${network}.solana.com"
  
  [provider]
  cluster = "${network}"
  wallet = "${path.resolve(destAuthKey)}"
  
  [scripts]
      `;
      const anchorTomlPath = `${projectPath}/Anchor.toml`;
      console.log('Writing Anchor.toml to:', anchorTomlPath);
      fs.writeFileSync(anchorTomlPath, anchorToml);
  
      // Execute build and deploy commands
      const anchorBuildCmd = `/home/bhulakshmi-ravuri/.cargo/bin/anchor build`;
      const anchorDeployCmd = `/home/bhulakshmi-ravuri/.cargo/bin/anchor deploy`;
      const fullCmd = `cd ${projectPath} && ${anchorBuildCmd} && ${anchorDeployCmd}`;
      console.log('Running build and deploy with command:', fullCmd);
  
      exec(fullCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('Deploy error stderr:', stderr);
          return res.status(500).json({ error: stderr });
        }
        console.log('Deploy stdout:', stdout);
  
        const soFilePath = `${projectPath}/target/deploy/${projectName}.so`;
        const idlPath = `${projectPath}/target/idl/${projectName}.json`;
  
        console.log('Checking if build artifacts exist...');
        console.log('SO file exists:', fs.existsSync(soFilePath));
        console.log('IDL file exists:', fs.existsSync(idlPath));
  
        if (!fs.existsSync(soFilePath) || !fs.existsSync(idlPath)) {
          return res.status(500).json({ error: 'Build or IDL generation failed' });
        }
  
        const programAddressMatch = stdout.match(/Program Id: (.+)/);
        const programId = programAddressMatch ? programAddressMatch[1].trim() : 'Unknown';
  
        console.log('Program deployed with ID:', programId);
  
        res.json({
          message: 'Program deployed!',
          programId,
          soFile: soFilePath,
          idlFile: idlPath,
        });
      });
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
