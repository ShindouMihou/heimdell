# Heimdell

**Heimdell** is an experimental bundle server for React Native applications, designed to work alongside a dedicated command-line tool to enable fast over-the-air (OTA) updates via [react-native-ota-hot-update](https://github.com/vantuan88291/react-native-ota-hot-update).

## ⚙️ How It Works

Heimdell operates as part of a **two-component system**:

1. **CLI Tool**: Handles bundling your React Native app and uploading the output.
2. **Heimdell Server (this repo)**: Acts as a lightweight backend and bundle repository. It stores and serves app updates, enabling OTA support via [`react-native-ota-hot-update`](https://github.com/vantuan88291/react-native-ota-hot-update).

Whenever your app checks for updates, Heimdell provides the necessary metadata and assets.

## 🚧 Project Status

> Heimdell is currently **under development**.

The backend server functions as intended, but several issues remain—most notably:

* Image and asset references are not yet resolved in the current bundling flow.
* CLI support for apps using the **new React Native architecture** is still incomplete.

These limitations are known blockers and are being actively worked on.

## 🔧 Setup

> Heimdell uses [Bun](https://bun.sh) as its runtime. Make sure it's installed on your system.

### 1. Clone the Repository

```bash
git clone https://github.com/ShindouMihou/heimdell
cd heimdell
```

### 2. Configure the Server

Rename the example configuration file:

```bash
mv src/config/index.example.ts src/config/index.ts
```

Edit the file and adjust the configuration as needed for your environment.

### 3. Run the Server

```bash
bun run src/index.ts
```

### 4. Docker Setup (Optional)

You can create a Docker image for easier deployment:

```bash
docker build -t heimdell .
```

Furthermore, you can use Docker Compose to run either staging, production, or even both environments simultaneously.

```bash
chmod +x generate-compose.sh && ./generate-compose.sh <staging|production|all>
```

You can then start the services with:

```bash
docker compose -up -d
```

To create and push bundles to the Heimdell server, use the companion CLI tool:

👉 [heimdell-cli](https://github.com/ShindouMihou/heimdell-cli)

This includes functionality for:

* Bundle generation
* Uploading updates
* Managing release metadata

## 📚 Resources

* [`react-native-ota-hot-update`](https://github.com/vantuan88291/react-native-ota-hot-update) – OTA runtime update handler
* [`heimdell-cli`](https://github.com/ShindouMihou/heimdell-cli) – CLI companion for Heimdell.
