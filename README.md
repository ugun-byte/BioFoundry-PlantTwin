# 🌿 BioFoundry PlantTwin (바이오파운드리 플랜트윈)

> **Real-Time Virtual Plant Growth & Molecular Farming Digital Twin Engine**  
> Google DeepMind 오픈 스택 기반 실시간 가상 식물 생육 & 분자농업(Molecular Farming) 디지털 트윈 시뮬레이터

---

## 📌 1. 프로젝트 개요 (Overview)

**BioFoundry PlantTwin**은 식물의 생물리학적 지배 방정식(Farquhar 광합성, Arrhenius 효소 반응, Ball-Berry 기공전도도, 엽면 에너지 수지)과 분자농업 2차 대사산물(루테인, 카로티노이드, 재조합 단백질) 생합성 플럭스를 실시간 미분방정식(ODE)으로 수치 적분하여 시뮬레이션하는 **스마트팜 & 바이오 파운드리 디지털 트윈 엔진**입니다.

* **연구 목적**: 특정 고부가가치 유효 분자(예: 눈 건강 루테인)의 생산성을 극대화하는 최적 광스펙트럼(R:G:B:FR), 광주기, $CO_2$, 주야간 변온(DIF), 양액(EC/pH), 펄스형 UV-B 유도 스트레스 레시피 도출.
* **연계 플랫폼**: `Plant2Human AI` (식물성 기능성 원료 탐색 OS)와 연동되는 가상 바이오 생산 팩토리.

---

## 🔬 2. 검증된 5대 핵심 과학 모델 (Scientific Foundations)

1. **Farquhar-von Caemmerer-Berry (FvCB) 광합성 모델**:
   * Rubisco 카르복실화 속도($A_c$) 및 전자전달계 광반응 속도($A_j$) 한계 속도 계산.
2. **Arrhenius 효소 반응 동역학**:
   * $V_{cmax}$, $J_{max}$, 암호흡($R_d$)의 온도 의존성 및 고온 단백질 변성 수식 탑재.
3. **Ball-Berry-Leuning 기공전도도 ($g_s$) & Penman-Monteith 엽온($T_{leaf}$)**:
   * 수증기압차(VPD)와 증산 작용에 따른 증산 냉각 효과 계산.
4. **Lambert-Beer 군락 수광 모델**:
   * 엽면적지수($LAI$) 및 광소멸계수($k=0.65$)에 기반한 바이오매스 건중량 축적.
5. **분자농업 2차 대사산물 생합성 플럭스 ($dLutein/dt$)**:
   * 청색광 크립토크롬(CRY) 및 UV-B(UVR8) 광수용체 신호 전달을 통한 **PSY(Phytoene Synthase)** 효소 활성화 모델.

---

## 🏗️ 3. 시스템 아키텍처 및 모듈 구성

* **`biophysical-model.js`**: 순수 수학/물리/생화학 방정식 계산 엔진 (FvCB, Arrhenius, Stomata, Lutein Flux).
* **`environmental-engine.js`**: 가상 스마트 챔버 환경 엔진, Time-Warp(1x~3600x) 클럭, 8채널 IoT 센서 텔레메트리 스트림.
* **`plant-profile-manager.js`**: 식물 유전체/생리학 파라미터 매니저 (하드코딩 배제, 동적 커스텀 파라미터 수정 가능).
* **`plant-canvas-3d.js`**: 3D 절차적 식물 물리학 렌더러 (VPD 팽압 시들음, 굴광성, 세포 루테인 색소 발현).
* **`live-telemetry-charts.js`**: 실시간 링버퍼 기반 스트리밍 오실로스코프 (광합성 $A_n$ 및 루테인 합성 플럭스).
* **`app.js`**: 60 FPS 실시간 물리 루프 컨트롤러, AI 파레토 최적화기, 스마트팜 제어 JSON 및 Plant2Human 연동 브릿지.

---

## 🚀 4. 로컬 실행 방법 (Quick Start)

```bash
# 1. 저장소 클론
git clone https://github.com/<your-username>/BioFoundry-PlantTwin.git
cd BioFoundry-PlantTwin

# 2. 로컬 웹 서버 실행 (포트 3007)
python3 -m http.server 3007

# 3. 브라우저 접속
open http://localhost:3007
```

---

## 🗓️ 5. 연구 로드맵 및 다음 과제

- [x] **Phase 1: 실시간 생물리학/분자합성 시뮬레이션 코어 및 3D 렌더러 구축** (완료)
- [ ] **Phase 2: Plant2Human AI (localhost:3006)와 실시간 양방향 데이터 브릿지 연동**
- [ ] **Phase 3: 2호/3호 기능성 원료 라이브러리 확장 (안토시아닌, 레스베라트롤, 설포라판)**
- [ ] **Phase 4: Google DeepMind 강화학습(RL) 기반 AI 자율 재배 에이전트 탑재**

---

## 📄 라이선스 (License)
Apache-2.0 License
