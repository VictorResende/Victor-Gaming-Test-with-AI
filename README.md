# 🚀 Galaxy Defenders - Tower Defense 2D Mobile (Android & iOS)

Um jogo completo em 2D no estilo **Tower Defense** desenvolvido com **Phaser 3**, **TypeScript**, **Vite** e **Capacitor**, otimizado para dispositivos móveis **Android e iOS**.

---

## 📱 Recursos & Inovações

- **⚡ Cross-Platform Nativo**: Uma única base de código em TypeScript que compila tanto para **Android** (via Android Studio / APK) quanto para **iOS** (via Xcode / App Store).
- **🎯 5 Torres Estratégicas com 3 Níveis**:
  - *Metralhadora Gatling*: Alta cadência contra alvos velozes.
  - *Canhão de Artilharia*: Projéteis explosivos com dano em área (AoE).
  - *Torre Criogênica*: Ondas de congelamento e desaceleração.
  - *Feixe de Laser*: Dano contínuo de alta energia que penetra blindagens.
  - *Torre Tesla*: Arcos elétricos que saltam entre múltiplos alvos em cadeia.
- **👾 5 Classes de Inimigos**: Batedores rápidos, Soldados blindados, Tanques pesados, Drones voadores e Chefes (Boss Titãs).
- **🕹️ Controles Touch & Mobile First**:
  - Menu inferior touch-friendly com cards de construção e indicadores de custo.
  - Painel flutuante de inspeção: troca de prioridade de mira (*Primeiro, Mais Forte, Mais Próximo, etc.*), upgrade e venda.
  - Controles de velocidade (*Pausa tática, 1x, 2x, 4x*).
- **☄️ Habilidades Ativas Globais (Spells)**:
  - *Chuva de Meteoros*: Dano em área massivo.
  - *Pulso EMP*: Paralisa e desacelera todos os invasores.
  - *Drop de Suprimentos*: Injeção emergencial de ouro.
- **🌳 Árvore de Tecnologias (Meta-Progressão)**: Gaste estrelas conquistadas para desbloquear bônus permanentes.
- **🏆 Conquistas & Salvamento Offline**: Armazenamento seguro via `@capacitor/preferences` e feedback tátil com `@capacitor/haptics`.

---

## 🛠️ Como Rodar no Computador (Desenvolvimento Web)

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Iniciar Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   Abra no navegador em `http://localhost:3000` e ative o modo de dispositivo móvel nas ferramentas de desenvolvedor (F12) para simular toque e resoluções de smartphone (Landscape).

3. **Gerar Build de Produção Web**:
   ```bash
   npm run build
   ```

---

## 🤖 Como Gerar o App Nativo para Android

1. **Compilar e Sincronizar**:
   ```bash
   npm run build
   npx cap add android
   npx cap sync android
   ```

2. **Abrir no Android Studio**:
   ```bash
   npx cap open android
   ```
   No Android Studio, clique em **Build > Build Bundle(s) / APK(s) > Build APK(s)** ou conecte seu celular Android via USB com depuração ativada e clique em **Run**.

---

## 🍏 Como Gerar o App Nativo para iOS (iPhone / iPad)

1. **Compilar e Sincronizar**:
   ```bash
   npm run build
   npx cap add ios
   npx cap sync ios
   ```

2. **Abrir no Xcode**:
   ```bash
   npx cap open ios
   ```
   No Xcode, selecione o simulador do iPhone ou seu aparelho físico conectado e clique em **Play/Run**.
