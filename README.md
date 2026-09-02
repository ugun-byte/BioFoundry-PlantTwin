# 🌿 BioFoundry PlantTwin (바이오파운드리 플랜트윈)

> **Real-Time Virtual Plant Growth & Molecular Farming Digital Twin Engine**  
> Google DeepMind 오픈 기술 및 생물리학 지배방정식 기반 실시간 가상 식물 생육 & 분자농업(Molecular Farming) 디지털 트윈 시뮬레이터

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/Automated_Tests-112%20Passed-emerald.svg)](scratch/test_all_features.js)
[![Digital Twin](https://img.shields.io/badge/Digital_Twin-3D_Three.js_60FPS-00f2fe.svg)](#)
[![Industrial IoT](https://img.shields.io/badge/Modbus--TCP-Port_5020_Ready-8b5cf6.svg)](#)

---

## 📌 1. 프로젝트 개요 (Overview)

**BioFoundry PlantTwin**은 식물의 생물리학적 지배 방정식(Farquhar 광합성, Arrhenius 효소 반응, Ball-Berry 기공전도도, 엽면 에너지 수지)과 분자농업 2차 대사산물(루테인, 카로티노이드, 재조합 단백질) 생합성 플럭스를 실시간 미분방정식(ODE)으로 수치 적분하여 시뮬레이션하는 **차세대 스마트팜 & 바이오 파운드리 디지털 트윈 플랫폼**입니다.

* **핵심 목적**: 눈 건강 기능성 원료인 **루테인(Lutein, CAS 127-40-2)**을 비롯한 고부가가치 타깃 유효 물질의 수율을 극대화하는 최적 환경 레시피(광스펙트럼, $CO_2$, 주야간 DIF, 양액 EC/pH, UV-B 펄스 유도 스트레스)를 AI로 자율 도출하고 실제 스마트팜 하드웨어(PLC)를 직접 제어합니다.
* **연계 플랫폼**: `Plant2Human AI` (식물성 기능성 원료 탐색 OS)와 실시간 양방향 데이터 브릿지로 연동되어 원료 탐색부터 재배 생산까지 전 과정을 커버합니다.

---

## 🔬 2. 검증된 생물리학 모델 및 첨단 기능 모듈

### 🧬 1) 생물리학 & 분자 대사 코어 (`biophysical-model.js`)
1. **FvCB (Farquhar-von Caemmerer-Berry) 광합성 모델**:
   * Rubisco 카르복실화 속도($A_c$) 및 전자전달계 광반응 속도($A_j$) 제한 계산.
2. **Arrhenius 효소 반응 동역학**:
   * $V_{cmax}$, $J_{max}$, 암호흡($R_d$)의 온도 의존성 및 고온 단백질 변성 수식 탑재.
3. **Ball-Berry-Leuning 기공전도도 ($g_s$) & Penman-Monteith 엽온 에너지 수지 ($T_{leaf}$)**:
   * 수증기압차(VPD)와 증산 작용에 따른 증산 냉각($\Delta T = T_{leaf} - T_{air}$) 효과 정량화.
4. **분자농업 2차 대사산물 생합성 플럭스 ($dLutein/dt$)**:
   * 청색광 크립토크롬(CRY) 및 UV-B(UVR8) 광수용체 신호 전달을 통한 **PSY(Phytoene Synthase)** 효소 활성화 수식.
5. **근권 미생물 공생(PGPR) & CRISPR-Cas9 대사경로 리모델링**:
   * *Bacillus velezensis* 근권 미생물 인산 불용화 분해 및 LCY-e 유전자 녹아웃 기반 루테인 대사 경로 플럭스(FBA) 모델.

### 🧪 2) 9대 첨단 가상 생체 진단 스위트
* **C18 역상 HPLC 크로마토그래피**: 루테인($R_t = 6.82\,\text{min}$) 피크 면적 정량 및 화학적 순도(%) 분리.
* **엽면 초분광 반사율 (Hyperspectral 400~900nm)**: 잔토필 NPQ 광화학 반사 지수(PRI) 및 NDVI 의사색상.
* **도관 기포 파열 초음파 음향 방출 (UAE)**: 음압 수분 장력($\Psi_{stem}$)에 의한 기포 붕괴 파열률 계측 및 Web Audio 생체 음향 합성.
* **전기화학 임피던스 분광법 (EIS)**: 10Hz~1MHz 나이퀴스트 플롯 기반 세포막 무결성 및 활력도(%) 측정.
* **PAM 엽록소 형광 OJIP 동역학**: 광계 II 최대 양자 수율($F_v/F_m$) 실시간 진단.
* **도관 수액 유속 밀도 (Sap Flow)**: Granier 열소산법(TDP) 기반 일주기 수액 유속 스코프.
* **근권 전기생리학 (Root Electrophysiology)**: $H^+$-ATPase 양성자 펌프 전류 및 막전위($V_m$) 측정.
* **공변세포 ABA-칼슘 파동**: 건조 스트레스 시 기공 폐쇄 이온 채널(SLAC1) 동역학.
* **폐쇄형 순환 수경 ISE 이온 분석**: 배액 NPK 잔존 농도 및 폐쇄 루프 비료/용수 회수율 진단.

### 🧠 3) 강화학습(RL) 스튜디오 & 다목적 파레토 튜너 (`deepmind-rl-agent.js`, `autonomous-ai-optimizer.js`)
* **3대 강화학습 알고리즘 (DQN / PPO / SAC)**:
  * **DQN**: $\epsilon$-greedy 탐색 & 벨만 TD 오차 $\delta = r + \gamma \max Q' - Q$ 갱신.
  * **PPO**: 클리핑된 서러게이트 목적함수($r_t \hat{A}_t$)와 어드밴티지 추정 기반 정책 학습.
  * **SAC**: 최대 엔트로피 온도 계수($\alpha=0.2$)와 소프트 Q-타겟 기반 강건 정책 도출.
* **다목적 파레토 가중치 튜너 & 3D 물리 투영**:
  * 단일 마스터 슬라이더로 `에너지 절감(0%)` vs `수율 극대화(100%)` 가중치 비율을 조절하며, 3D 챔버 내부의 CFD 기류 파티클 유속 및 광자(Photon) 낙하 밀도에 실시간 연동.
* **스마트 그리드 연동 가상 발전소(VPP) 피크 저감 운전**:
  * 실시간 전력 도매 단가(SMP) 변동 신호를 감지하여, 200원 초과 피크 발생 시 조도와 팬 풍량을 최저 생존 레벨로 자동 감축하고 절감 요금을 집계.

### 🏭 4) 실제 스마트팜 PLC 게이트웨이 데몬 (`industrial-iot-gateway-daemon.js`)
* **산업용 표준 Modbus-TCP 서버 (포트 5020)**:
  * 지멘스, LS Electric, 미쓰비시 PLC 및 Python `pymodbus`와 통신 가능한 16개 16비트 Holding Register (40001~40016) 실시간 서빙.
* **실시간 웹소켓 브릿지 (포트 8092)**:
  * 브라우저 프론트엔드와 1~3ms 초저지연 양방향 동기화 및 FC06 제어 명령 수신.

### 📜 5) GMP 규격 분자농업 생산 인증서 (CoA) & A4 PDF 인쇄
* **Ph. Eur. / USP 규격 7대 필수 시험 항목 자동 판정**:
  * 식물체 동정, HPLC 순도, 유효 성분 함량, 세포막 활성, 중금속, 미생물, 잔류물질 시험 성적서 생성.
* **위변조 방지 암호화 전자서명 & QR 코드**:
  * SHA-256 디지털 해시 서명 및 진위 확인용 QR 코드 생성.
* **A4 고품질 PDF 인쇄 스타일시트 (`@media print`)**:
  * 원클릭으로 어두운 화면을 배제하고 인쇄용 순백 A4 공식 시험성적서 PDF 파일 저장 지원.

---

## 🏗️ 3. 저장소 파일 구성 및 아키텍처

```
BioFoundry-PlantTwin/
├── index.html                        # 3D 뷰포트, SCADA, RL 스튜디오, 모달 통합 UI
├── style.css                         # 글래스모피즘 디자인 토큰 및 A4 CoA 인쇄 스타일시트
├── app.js                            # 60FPS 실시간 물리 루프 컨트롤러 & 이벤트 브릿지
├── biophysical-model.js              # FvCB 광합성, 루테인 대사, 9대 생체 수식 엔진
├── three-plant-chamber.js            # Three.js 3D 리액터, 잎/뿌리 CFD 기류, 광자, FLIR 열화상
├── deepmind-rl-agent.js              # DQN/PPO/SAC 심층 신경망 가중치 훈련 & ONNX 내보내기
├── autonomous-ai-optimizer.js        # 다차원 그리드 탐색 & 3각 파레토 프론티어 곡면 생성기
├── industrial-iot-bridge.js          # Modbus-TCP 레지스터 매핑 및 MQTT JSON 생성기
├── industrial-iot-gateway-daemon.js  # Node.js 실제 스마트팜 PLC Modbus-TCP / WS 데몬
├── live-telemetry-charts.js          # 60FPS 듀얼 오실로스코프, HPLC, 초분광, UAE 파형 렌더러
├── plant-profile-manager.js          # 메리골드, 시금치, 케일, 담배, 포도 등 6개 작물 DB
├── data-exporter.js                  # CSV 텔레메트리, GMP CoA 생성 및 4K 스냅샷 캡처
├── sound-effects.js                  # Web Audio API 생체 음향 합성기
├── diurnal-scheduler.js              # 24시간 일주기 스케줄러
├── LICENSE                           # Apache License 2.0 공식 전문
└── scratch/test_all_features.js      # 112개 전수 통합 자동화 테스트 스위트
```

---

## 🚀 4. 다른 PC 원클릭 100% 실행 및 설치 가이드 (Quick Start & Installation)

이 프로젝트는 무거운 빌드 과정이나 데이터베이스 설치 없이 **웹 표준 기술(HTML5 / ES6 JavaScript / CSS3 / Three.js)**로 구현되어 있어, **전 세계 어느 PC(Windows, Mac, Linux)에서든 더블클릭 한 번으로 100% 동일하게 즉시 실행**됩니다.

---

### ⚡ [초간단] 원클릭 1초 실행 파일 (One-Click Launchers)

저장소를 클론(`git clone`)한 후, 본인의 운영체제에 맞는 파일을 **마우스로 더블클릭**만 하시면 웹 서버 실행 및 브라우저 창이 자동으로 열립니다!

* 🪟 **Windows 사용자**: **`start_planttwin.bat`** 더블클릭 실행!
* 🍎 **Mac / Linux 사용자**: **`./start_planttwin.sh`** (또는 터미널에서 `./start_planttwin.sh`) 실행!
* 📦 **Node.js / npm 사용자**: **`npm start`** 또는 **`node run.js`** 실행!

---

### 💻 [수동 실행] 터미널 명령어 3단계

#### Step 1. 깃 저장소 복사 (Clone)
새로운 PC의 터미널(Terminal) 또는 윈도우 명령 프롬프트(CMD/PowerShell)를 열고 다음 명령어를 입력합니다:
```bash
git clone https://github.com/ugun-byte/BioFoundry-PlantTwin.git
cd BioFoundry-PlantTwin
```

---

#### Step 2. 로컬 웹 서버 구동 (아래 방법 중 택 1)

* **방법 1 (원클릭 Node.js 러너 - 가장 추천 ⭐)**:
  ```bash
  npm start
  # 또는
  node run.js
  ```
* **방법 2 (파이썬이 설치되어 있을 때)**:
  * Mac/Linux: `python3 -m http.server 3007`
  * Windows: `python -m http.server 3007`
* **방법 3 (VS Code 확장 프로그램)**:
  1. VS Code에서 `BioFoundry-PlantTwin` 폴더를 엽니다.
  2. 확장 탭에서 **Live Server**를 설치한 뒤, 우측 하단의 `Go Live` 버튼을 클릭합니다.
* **방법 4 (npx serve)**:
  ```bash
  npx serve -l 3007 .
  ```

---

### 🖥️ Step 3. 웹 브라우저 접속
크롬(Chrome), 엣지(Edge), 사파리(Safari) 등 웹 브라우저 주소창에 아래 주소를 입력합니다:
```
http://localhost:3007
```
👉 3D 식물 생육 챔버, 9대 생체 진단기, DeepMind 강화학습 스튜디오, 가상 발전소(VPP), GMP 성적서 발행 시스템이 **100% 동일하게 로딩**됩니다.

---

### 🔌 Step 4. [선택 사항] 실제 스마트팜 PLC 게이트웨이 데몬 가동
실제 산업용 스마트팜 PLC 장비(지멘스, LS Electric, pymodbus)와 실시간 Modbus-TCP 통신을 연동하려면 터미널 창을 하나 더 열고 실행합니다:
```bash
node industrial-iot-gateway-daemon.js
```
* **Modbus-TCP 포트**: `5020` (16개 Holding Register 40001~40016 실시간 서빙)
* **웹소켓 브릿지 포트**: `8092` (웹 브라우저와 1~3ms 초저지연 양방향 동기화)
* 웹 화면의 **원격 계측 (SCADA)** 탭에서 `[🔌 PLC 하드웨어 데몬 연결]` 버튼을 누르면 실시간 연동이 활성화됩니다.

---

### 🧪 Step 5. 112개 전수 자동화 통합 테스트 실행
```bash
node scratch/test_all_features.js
```
* 생물리학 모델, AI 최적화 알고리즘, DQN/PPO/SAC 강화학습 신경망, Modbus 게이트웨이, GMP 성적서의 정합성을 100% 검증합니다.

---

## 🗓️ 5. 연구개발 마일스톤 (Milestones)

- [x] **Phase 1: 실시간 생물리학/분자합성 시뮬레이션 코어 & 3D 챔버 및 9대 생체 진단기 구축** (완료 ✅)
- [x] **Phase 2: Plant2Human AI 크로스 PC REST API 실시간 양방향 데이터 브릿지 & 오프라인 자동 캐시 폴백** (완료 ✅)
- [x] **Phase 3: 2호/3호 기능성 원료 라이브러리 및 틸라코이드 ETC 동역학 확장** (완료 ✅)
- [x] **Phase 4: 심층 강화학습(DQN/PPO/SAC) 및 다목적 파레토 최적화 자율 에이전트 탑재** (완료 ✅)
- [x] **Phase 5: 상용 스마트팜 온실 실시간 PLC/Modbus-TCP 실제 하드웨어 통신 게이트웨이 데몬 구축** (완료 ✅)
- [x] **Phase 6: GMP 규격 바이오 의약품 생산 인증서(CoA) 자동 암호화 및 A4 PDF 인쇄 시스템** (완료 ✅)

### 🔗 Plant2Human AI 크로스 PC 연동 가이드
* **동일 PC 환경**: 기본 `http://localhost:3006`으로 실시간 자동 연결
* **다른 PC / 원격 분산 설치 환경**:
  * PlantTwin 상단 `[Plant2Human 연동]` 버튼 클릭 후 모달 상단의 엔드포인트 주소창에 Plant2Human이 실행 중인 PC의 IP(예: `http://192.168.0.25:3006` 또는 원격 도메인)를 입력하고 `[연결 테스트]`를 누르면 즉시 동기화됩니다.
  * 브라우저 CORS 제약을 우회하기 위해 `run.js` 내부의 백엔드 리버스 프록시(`/api/p2h-proxy`)가 자동 가동되어 **어떤 네트워크 환경에서도 100% 통신**됩니다.
  * Plant2Human 서버가 꺼져 있어도 시뮬레이터가 멈추지 않고 **`[오프라인 안전 캐시 모드]`**로 자동 전환되어 데이터 연속성을 보장합니다.

---

## 📄 라이선스 (License)

This project is licensed under the **Apache-2.0 License** - see the [LICENSE](LICENSE) file for details.
