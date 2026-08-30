# 🌿 BioFoundry PlantTwin (바이오파운드리 플랜트윈)

> **Real-Time Virtual Plant Growth & Molecular Farming Digital Twin Engine**  
> Google DeepMind 오픈 스택 기반 실시간 가상 식물 생육 & 분자농업(Molecular Farming) 디지털 트윈 시뮬레이터

---

## 📌 1. 프로젝트 개요 (Overview)

**BioFoundry PlantTwin**은 식물의 생물리학적 지배 방정식(Farquhar 광합성, Arrhenius 효소 반응, Ball-Berry 기공전도도, 엽면 에너지 수지)과 분자농업 2차 대사산물(루테인, 카로티노이드, 재조합 단백질) 생합성 플럭스를 실시간 미분방정식(ODE)으로 수치 적분하여 시뮬레이션하는 **스마트팜 & 바이오 파운드리 디지털 트윈 엔진**입니다.

* **연구 목적**: 특정 고부가가치 유효 분자(예: 눈 건강 루테인)의 생산성을 극대화하는 최적 광스펙트럼(R:G:B:FR), 광주기, $CO_2$, 주야간 변온(DIF), 양액(EC/pH), 펄스형 UV-B 유도 스트레스 레시피 도출.
* **연계 플랫폼**: `Plant2Human AI` (식물성 기능성 원료 탐색 OS)와 연동되는 가상 바이오 생산 팩토리.

---

## 🔬 2. 검증된 8대 핵심 과학 모델 (Scientific Foundations)

1. **Farquhar-von Caemmerer-Berry (FvCB) 광합성 모델**:
   * Rubisco 카르복실화 속도($A_c$) 및 전자전달계 광반응 속도($A_j$) 한계 속도 계산.
2. **Arrhenius 효소 반응 동역학**:
   * $V_{cmax}$, $J_{max}$, 암호흡($R_d$)의 온도 의존성 및 고온 단백질 변성 수식 탑재.
3. **Ball-Berry-Leuning 기공전도도 ($g_s$) & Penman-Monteith 엽온($T_{leaf}$)**:
   * 수증기압차(VPD)와 증산 작용에 따른 증산 냉각($\Delta T = T_{leaf} - T_{air}$) 효과 계산.
4. **Lambert-Beer 군락 수광 & 오토제니(Ontogeny) 발달 모델**:
   * 엽면적지수($LAI$) 기반 건물중 축적 및 유묘기 $\rightarrow$ 영양생장 $\rightarrow$ 개화기 3D 형태형성.
5. **분자농업 2차 대사산물 생합성 플럭스 ($dLutein/dt$)**:
   * 청색광 크립토크롬(CRY) 및 UV-B(UVR8) 광수용체 신호 전달을 통한 **PSY(Phytoene Synthase)** 효소 활성화 모델.
6. **C18 역상 고성능 액체 크로마토그래피 (HPLC) 화학 분리 정량**:
   * 루테인($R_t = 6.82\,\text{min}$), 잔토필, 엽록소, $\beta$-카로틴의 450nm 흡광 피크 면적($\text{mAU}\cdot\text{s}$) 및 순도 적분.
7. **엽면 초분광 반사율 (Hyperspectral 400nm~900nm) & NDVI / PRI**:
   * 잔토필 탈에폭시화(NPQ) 광화학 반사 지수(PRI) 및 3D 캐노피 의사색상(False-Color) 뷰.
8. **도관 기포 파열 초음파 음향 방출 (UAE, 20~100kHz) & Web Audio 생체 음향 합성**:
   * 도관 내 음압 수분 장력($\Psi_{stem}$)에 의한 기포 붕괴 파열률 계측 및 가청 주파수 변조 청취.

---

## 🏗️ 3. 시스템 아키텍처 및 9대 첨단 생체 진단 모듈

* **`biophysical-model.js`**: FvCB 광합성, 기공전도도, 엽온 수지, HPLC 분리, 초분광 NDVI/PRI, 도관 초음파(UAE), 근권 막전위($V_m$), PAM 형광 OJIP 동역학 계산 엔진.
* **`three-plant-chamber.js`**: Three.js 기반 3D 바이오리액터 챔버, FLIR Ironbow 열화상 셰이더, 도관 수액 상승 3D 유선(Streamline), 초분광 의사색상, 투명 4K 스냅샷 캡처.
* **`industrial-iot-bridge.js`**: 스마트팜 표준 Modbus-TCP 16비트 Holding Register (40001~40016), FC03 Hex 생성기, MQTT JSON 텔레메트리 스트림.
* **`live-telemetry-charts.js`**: 60 FPS 듀얼 오실로스코프(전체화면 모드 지원), HPLC 크로마토그램, 초분광 스펙트럼, UAE 파형 렌더러.
* **`environmental-engine.js`**: Time-Warp(1x~3600x) 가변 배속 환경 엔진, 8채널 가상 IoT 센서 텔레메트리 스트림.
* **`sound-effects.js`**: Web Audio API 기반 제로 레이턴시 생체 음향 합성기 (도관 기포 파열음, HPLC 인젝션 기계음, 초분광 스캔음).
* **`app.js`**: 60 FPS 실시간 물리 루프 컨트롤러, 2단 반응형 툴바, AI 파레토 최적화기 및 9대 생체 진단 인터페이스.

---

## 🚀 4. 로컬 실행 방법 (Quick Start)

```bash
# 1. 저장소 클론
git clone https://github.com/ugun-byte/BioFoundry-PlantTwin.git
cd BioFoundry-PlantTwin

# 2. 로컬 웹 서버 실행 (포트 3007)
python3 -m http.server 3007

# 3. 브라우저 접속
open http://localhost:3007
```

---

## 🗓️ 5. 연구 로드맵 및 마일스톤

- [x] **Phase 1: 실시간 생물리학/분자합성 시뮬레이션 코어 & 3D 챔버 및 9대 생체 진단기 구축** (완료 ✅)
- [ ] **Phase 2: Plant2Human AI (localhost:3006)와 실시간 양방향 데이터 브릿지 연동**
- [ ] **Phase 3: 2호/3호 기능성 원료 라이브러리 확장 (안토시아닌, 레스베라트롤, 설포라판)**
- [ ] **Phase 4: Google DeepMind 강화학습(RL) 기반 AI 자율 재배 에이전트 탑재**

---

## 📄 라이선스 (License)
Apache-2.0 License
