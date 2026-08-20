import importlib.util
import copy
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERIFY_PATH = ROOT / "scripts" / "verify-portfolio.py"


def load_verifier():
    spec = importlib.util.spec_from_file_location("verify_portfolio", VERIFY_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PortfolioVerifierBootstrapTests(unittest.TestCase):
    def test_verifier_module_exists(self):
        self.assertTrue(VERIFY_PATH.is_file(), "portfolio verifier module is missing")

    def test_verifier_exposes_source_contract(self):
        verify = load_verifier()
        self.assertTrue(hasattr(verify, "load_yaml"))
        self.assertTrue(hasattr(verify, "validate_source"))
        self.assertTrue(hasattr(verify, "REQUIRED_ARCHITECTURE_NODE_IDS"))
        self.assertTrue(hasattr(verify, "REQUIRED_ARCHITECTURE_FLOWS"))

    def test_verifier_exposes_pdf_contract(self):
        verify = load_verifier()
        self.assertTrue(hasattr(verify, "PDF_PROFILES"))
        self.assertTrue(hasattr(verify, "validate_pdf"))

    def test_load_yaml_uses_the_repository_ruby_runtime(self):
        verify = load_verifier()
        with tempfile.NamedTemporaryFile("w", suffix=".yml", encoding="utf-8") as handle:
            handle.write("profile:\n  theme: ice-blue\n")
            handle.flush()
            self.assertEqual(
                verify.load_yaml(Path(handle.name)),
                {"profile": {"theme": "ice-blue"}},
            )


class PortfolioSourceContractTests(unittest.TestCase):
    def setUp(self):
        self.verify = load_verifier()
        node_ids = {
            "pda",
            "web",
            "api",
            "queue",
            "worker",
            "external",
            "local-llm",
            "data",
        }
        node_fields = {
            "label": "구성요소",
            "tech": "기술",
            "kind": "app",
            "boundary": "application",
            "summary": "요약",
            "implementation": "구현",
            "structure": "구조",
            "operation": "운영",
            "inputs": "입력",
            "outputs": "출력",
            "contract": "계약",
            "deployment": "배포",
            "x": 10,
            "y": 10,
            "width": 100,
            "height": 70,
        }
        self.content = {
            "metrics": [
                {"id": "legacy-integration", "source": "경력기술서"},
                {"id": "work-screens", "source": "아키텍처"},
            ],
            "flagship": {
                "scope_summary": ["15종 시스템 분석", "90+ 화면 구현"],
                "nodes": [
                    {"id": node_id, **node_fields}
                    for node_id in sorted(node_ids)
                ],
                "edges": [
                    {
                        "id": "web-api",
                        "from": "web",
                        "to": "api",
                        "flow": "sync",
                        "label": "REST",
                        "path": "M10 10 H20",
                        "label_x": 15,
                        "label_y": 8,
                    },
                    {
                        "id": "api-queue",
                        "from": "api",
                        "to": "queue",
                        "flow": "async",
                        "label": "enqueue",
                        "path": "M10 10 H20",
                        "label_x": 15,
                        "label_y": 8,
                    },
                ],
                "pipeline": {
                    "steps": ["변경 앱 감지", "Test", "Kaniko Build", "Swarm Deploy"]
                },
            },
            "automation": {"title": "외부 업무 시스템 입력 자동화"},
        }
        self.profiles = {
            "default": {
                "metrics": ["legacy-integration"],
            },
            "kakao": {
                "metrics": ["work-screens"],
            },
        }

    def test_valid_contract_has_no_errors(self):
        self.assertEqual(self.verify.validate_source(self.content, self.profiles), [])

    def test_all_ten_architecture_nodes_are_required(self):
        self.assertEqual(
            {item["id"] for item in self.content["flagship"]["nodes"]},
            self.verify.REQUIRED_ARCHITECTURE_NODE_IDS,
        )

    def test_all_four_architecture_flows_are_required(self):
        self.assertEqual(
            {item["flow"] for item in self.content["flagship"]["edges"]},
            self.verify.REQUIRED_ARCHITECTURE_FLOWS,
        )

    def test_unknown_edge_endpoint_fails(self):
        content = copy.deepcopy(self.content)
        content["flagship"]["edges"][0]["to"] = "missing-node"
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("missing-node" in error for error in errors))

    def test_missing_metric_source_fails(self):
        content = copy.deepcopy(self.content)
        content["metrics"][0]["source"] = ""
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("source" in error for error in errors))

    def test_proprietary_client_name_fails(self):
        content = copy.deepcopy(self.content)
        content["automation"]["title"] = "삼성 NERP 자동화"
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("익명화" in error for error in errors))

    def test_internal_system_code_fails(self):
        content = copy.deepcopy(self.content)
        content["automation"]["title"] = "EXPDECLCERT 처리 자동화"
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("익명화" in error for error in errors))

    def test_internal_screen_code_fails(self):
        content = copy.deepcopy(self.content)
        content["automation"]["title"] = "AIRE3001 화면 개선"
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("익명화" in error for error in errors))

    def test_incomplete_architecture_node_fails(self):
        content = copy.deepcopy(self.content)
        del content["flagship"]["nodes"][0]["deployment"]
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("deployment" in error for error in errors))

    def test_incomplete_architecture_edge_fails(self):
        content = copy.deepcopy(self.content)
        del content["flagship"]["edges"][0]["label"]
        errors = self.verify.validate_source(content, self.profiles)
        self.assertTrue(any("label" in error for error in errors))

    def test_repository_canonical_source_is_valid(self):
        content_path = ROOT / "_data" / "portfolio.yml"
        profiles_path = ROOT / "_data" / "portfolio_profiles.yml"
        self.assertTrue(content_path.is_file(), "canonical portfolio data is missing")
        self.assertTrue(profiles_path.is_file(), "portfolio profile data is missing")
        content = self.verify.load_yaml(content_path)
        profiles = self.verify.load_yaml(profiles_path)
        self.assertEqual(self.verify.validate_source(content, profiles), [])

    def test_architecture_claim_audit_uses_code_grounded_node_text(self):
        content = self.verify.load_yaml(ROOT / "_data" / "portfolio.yml")
        nodes = {
            node["id"]: node for node in content["flagship"]["nodes"]
        }
        expected = {
            ("worker", "contract"): "공용 작업 계약 패키지 · 단기 인증 토큰",
            ("web", "operation"): "화면과 기능이 폴더 단위로 갈려 있어 수정 범위가 그 폴더 안에 머뭅니다.",
            ("queue", "operation"): "큐마다 동시성과 락 유지 시간을 따로 정의했습니다. 오래 걸리는 잡만 락을 올리고 나머지는 기본값을 씁니다.",
            ("local-llm", "implementation"): "추론 서버를 사내망 장비에 띄우고 HTTP로 호출합니다. 고객사 문서라 망 밖으로 나갈 수 없어 외부 API를 쓰지 않았습니다. 추출 결과는 JSON Schema와 정규식으로 교차 검증합니다.",
            ("local-llm", "operation"): "PDF에 텍스트 레이어가 있으면 그대로 읽고, 스캔본만 OCR로 처리합니다. 렌더 해상도는 실물 문서로 반복 측정해 정했습니다. 300dpi에서 나던 오인식이 400dpi에서 사라졌고 처리 시간은 거의 같았습니다.",
            ("local-llm", "structure"): "텍스트 레이어 판정\n· 스캔본 OCR(전체 페이지 → 표 영역 재인식)\n· schema parser · evaluation harness",
            ("external", "tech"): "EDI 전문 · 저울 TCP 소켓 · FTP · 스케줄 수집",
            (
                "external",
                "structure",
            ): "요청형 EDI 전송\n· 수집형 스케줄러\n  (환율·선사·항구·운임 마스터, 공휴일, 요율)\n· TCP 클라이언트로 저울 데이터 수집\n· 파일 교환",
        }
        for (node_id, field), value in expected.items():
            with self.subTest(node_id=node_id, field=field):
                self.assertEqual(nodes[node_id][field], value)

    def test_tree_expansion_claims_match_confirmed_source_structure(self):
        content = self.verify.load_yaml(ROOT / "_data" / "portfolio.yml")
        nodes = {
            node["id"]: node for node in content["flagship"]["nodes"]
        }
        expected = {
            ("web", "structure"): "<도메인 화면>/\n├─ _container/       화면 조합 · 상태 연결\n├─ _features/        업무 기능 묶음\n│  └─ <기능>/\n│     ├─ container/  기능 상태 · 이벤트\n│     ├─ view/       기능 표현\n│     └─ hooks/      기능별 훅\n├─ _hooks/           화면 공통 훅\n└─ _store/           화면 상태",
            ("api", "structure"): "<모듈>/\n├─ adapter/\n│  ├─ controller/          HTTP 진입\n│  └─ dto/\n├─ application/\n│  └─ usecase/\n│     └─ <유스케이스>/\n│        ├─ *.usecase.ts   업무 기능 하나\n│        ├─ dto.ts\n│        └─ mapper.ts\n└─ infra/\n   └─ repository/          읽기 · 쓰기 분리",
            ("web", "implementation"): "화면 단위 로컬 슬라이스와 공통 도메인 슬라이스를 분리하고, 서버 상태와 화면 상태의 책임을 나눴습니다. 기능이 많은 화면은 그 안에서 기능별로 다시 나눴습니다.",
            ("local-llm", "implementation"): "추론 서버를 사내망 장비에 띄우고 HTTP로 호출합니다. 고객사 문서라 망 밖으로 나갈 수 없어 외부 API를 쓰지 않았습니다. 추출 결과는 JSON Schema와 정규식으로 교차 검증합니다.",
            ("data", "summary"): "여러 DBMS에서 옮겨와 하나로 합친 운영 데이터",
            ("data", "implementation"): "흩어져 있던 운영 데이터를 스키마부터 다시 설계해 PostgreSQL 하나로 합쳤습니다.",
            ("data", "operation"): "스키마 변경은 마이그레이션 파일로 관리합니다.",
        }
        for (node_id, field), value in expected.items():
            with self.subTest(node_id=node_id, field=field):
                self.assertEqual(nodes[node_id][field], value)
        self.assertEqual(nodes["web"]["structure_type"], "tree")
        self.assertEqual(nodes["api"]["structure_type"], "tree")
        for node_id in ("pda", "external", "local-llm", "data", "queue", "worker"):
            self.assertNotIn("structure_type", nodes[node_id])

    def test_architecture_io_and_deployment_claims_follow_edge_direction(self):
        content = self.verify.load_yaml(ROOT / "_data" / "portfolio.yml")
        nodes = {
            node["id"]: node for node in content["flagship"]["nodes"]
        }
        expected = {
            ("api", "inputs"): "Web·PDA REST 요청 · Worker 내부 배치 실행 요청",
            ("api", "outputs"): "Repository 호출 · 로컬 LLM 호출 · 외부 연동 · Queue job · 배치 실행 결과",
            ("external", "inputs"): "플랫폼 요청 · 스케줄 수집",
            ("worker", "inputs"): "큐 작업 · 예약 스케줄",
            ("worker", "outputs"): "API 내부 실행 요청",
            ("queue", "outputs"): "Worker로 전달되는 작업 · 재시도 · 실패 기록",
        }
        for (node_id, field), value in expected.items():
            with self.subTest(node_id=node_id, field=field):
                self.assertEqual(nodes[node_id][field], value)

    def test_node_category_claims_keep_external_and_data_boundaries_distinct(self):
        content = self.verify.load_yaml(ROOT / "_data" / "portfolio.yml")
        nodes = {node["id"]: node for node in content["flagship"]["nodes"]}
        self.assertEqual(
            nodes["api"]["operation"],
            "요청 검증, 권한, 공통 오류 변환과 추적 정보를 한 경계에서 처리했습니다. 외부 오류는 내부 오류 형식으로 바꾸고 재시도 가능 여부를 구분했습니다.",
        )
        self.assertNotIn("operation", nodes["external"])
        self.assertNotIn("deployment", nodes["external"])
        self.assertEqual(nodes["external"]["outputs"], "전문 응답 · 마스터 데이터 · 저울 측정값")
        self.assertEqual(
            nodes["data"]["implementation"],
            "흩어져 있던 운영 데이터를 스키마부터 다시 설계해 PostgreSQL 하나로 합쳤습니다.",
        )
        self.assertEqual(nodes["data"]["structure"], "업무 스키마 · 마이그레이션")
        self.assertEqual(nodes["data"]["inputs"], "API의 데이터 접근")
        self.assertEqual(nodes["data"]["contract"], "SQL · 트랜잭션 경계")

    def test_external_may_omit_operation_and_deployment_only(self):
        content = copy.deepcopy(self.content)
        external = next(node for node in content["flagship"]["nodes"] if node["id"] == "external")
        del external["operation"]
        del external["deployment"]
        self.assertEqual(self.verify.validate_source(content, self.profiles), [])

    def test_data_may_omit_deployment_when_not_published(self):
        content = copy.deepcopy(self.content)
        data = next(node for node in content["flagship"]["nodes"] if node["id"] == "data")
        del data["deployment"]
        self.assertEqual(self.verify.validate_source(content, self.profiles), [])

    def test_document_flow_keeps_confirmed_eight_step_pipeline(self):
        content = self.verify.load_yaml(ROOT / "_data" / "portfolio.yml")
        flow = content["flagship"]["document_flow"]
        nodes = {node["id"]: node for node in flow["nodes"]}
        self.assertEqual(
            set(nodes),
            {
                "doc-intake",
                "doc-layer",
                "doc-ocr",
                "doc-extract",
                "doc-verify",
                "doc-success",
                "doc-retry",
                "doc-final-fail",
            },
        )
        expected_nodes = {
            "doc-intake": ("첨부 업로드", "큐 등록"),
            "doc-layer": ("텍스트 레이어 판정", ""),
            "doc-ocr": ("스캔본 OCR", "자식 프로세스 격리"),
            "doc-extract": ("LLM 추출", "사내망 추론"),
            "doc-verify": ("교차 검증", "JSON Schema · 정규식"),
            "doc-success": ("구조화 저장", "부분 성공도 저장"),
            "doc-retry": ("재시도", "3회 · 지수 백오프"),
            "doc-final-fail": ("최종 실패 기록", "재시도 안 함"),
        }
        for node_id, (label, detail) in expected_nodes.items():
            with self.subTest(node_id=node_id):
                self.assertEqual(nodes[node_id]["label"], label)
                self.assertEqual(nodes[node_id]["detail"], detail)

        expected_edges = {
            ("doc-intake", "doc-layer", ""),
            ("doc-layer", "doc-extract", "텍스트 있음"),
            ("doc-layer", "doc-ocr", "스캔본"),
            ("doc-ocr", "doc-extract", ""),
            ("doc-extract", "doc-verify", ""),
            ("doc-verify", "doc-success", "통과"),
            ("doc-verify", "doc-retry", "재시도 가능"),
            ("doc-verify", "doc-final-fail", "값 없음"),
            ("doc-retry", "doc-extract", "재처리"),
        }
        self.assertEqual(
            {
                (edge["from"], edge["to"], edge["label"])
                for edge in flow["edges"]
            },
            expected_edges,
        )
        description = "\n".join(flow["description"])
        for phrase in (
            "Worker 동시성은 프로세스당 1건, 운영 레플리카 2개라 서버 전체 최대 2건",
            "큐 등록이 실패해도 첨부 업로드는 실패시키지 않고 경고 로그로 남깁니다",
            "OCR은 자식 프로세스에서 건별로 실행하고, 부모는 파일 경로만 넘깁니다",
            "타임아웃이면 SIGTERM 후 필요 시 SIGKILL",
            "렌더 해상도는 실물 문서로 반복 측정해 정했습니다",
            "300dpi에서 나던 오인식이 400dpi에서 사라졌고 처리 시간은 거의 같았습니다",
            "재시도는 3회, 30초 지수 백오프",
            "반복 평가 결과를 저장해 변경 전후를 비교합니다 (evaluation harness)",
        ):
            self.assertIn(phrase, description)

    def test_document_retry_loop_routes_between_intake_and_layer_nodes(self):
        content = self.verify.load_yaml(ROOT / "_data" / "portfolio.yml")
        flow = content["flagship"]["document_flow"]
        nodes = {node["id"]: node for node in flow["nodes"]}
        retry_loop = next(edge for edge in flow["edges"] if edge["id"] == "retry-loop")
        match = re.search(r"^M700 357 H(\d+) V24 H470 V70$", retry_loop["path"])
        self.assertIsNotNone(match)
        loop_x = int(match.group(1))
        intake = nodes["doc-intake"]
        layer = nodes["doc-layer"]
        self.assertGreater(loop_x, intake["x"] + intake["width"])
        self.assertLess(loop_x, layer["x"])

    def test_source_only_cli_reports_success(self):
        completed = subprocess.run(
            ["python3", str(VERIFY_PATH), "--source-only"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        self.assertIn("PASS: portfolio source contract", completed.stdout)


class PortfolioRenderedContractTests(unittest.TestCase):
    def setUp(self):
        self.verify = load_verifier()

    def test_rendered_contract_api_exists(self):
        self.assertTrue(hasattr(self.verify, "RENDERED_PROFILES"))
        self.assertTrue(hasattr(self.verify, "validate_rendered"))

    def test_rendered_profiles_have_shell_and_correct_theme(self):
        self.assertTrue(hasattr(self.verify, "validate_rendered"))
        errors = self.verify.validate_rendered(ROOT / "_site")
        self.assertEqual(errors, [])

    def test_site_cli_reports_source_and_rendered_success(self):
        completed = subprocess.run(
            ["python3", str(VERIFY_PATH), "--site-dir", "_site"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("PASS: portfolio source contract", completed.stdout)
        self.assertIn("PASS: portfolio rendered contract", completed.stdout)

    def test_rendered_profiles_include_four_journey_steps(self):
        journey_ids = (
            "iljin-foundation",
            "iljin-lead",
            "kwe-automation",
            "kwe-platform",
        )
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('id="career-journey"', text)
            self.assertEqual(text.count("data-journey-item"), 4)
            for journey_id in journey_ids:
                self.assertIn(f'id="journey-{journey_id}"', text)

    def test_rendered_profiles_render_hero_before_career_journey(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('class="portfolio-hero"', text)
            self.assertIn('id="hero-name"', text)
            self.assertEqual(text.count("data-hero-metric="), 4)
            self.assertIn('<h2 id="journey-title">주요 경력</h2>', text)
            self.assertIn(
                "제조·물류 시스템을 개발하고 운영해 온 경험을 시간순으로 정리했습니다.",
                text,
            )
            # 경력기술서와 중복되는 표지형 카피는 여전히 금지
            self.assertNotIn("개발에서 플랫폼 책임까지", text)
            self.assertLess(
                text.index('class="portfolio-hero"'),
                text.index('id="career-journey"'),
            )
            self.assertLess(
                text.index('id="career-journey"'),
                text.index('id="flagship"'),
            )

    def test_journey_script_has_accessible_fallbacks(self):
        script_path = ROOT / "assets" / "js" / "portfolio.js"
        self.assertTrue(script_path.is_file(), "portfolio enhancement script is missing")
        script = script_path.read_text(encoding="utf-8")
        for phrase in ("IntersectionObserver", "prefers-reduced-motion", "is-current"):
            self.assertIn(phrase, script)

    def test_architecture_script_supports_mouse_and_keyboard_selection(self):
        script = (ROOT / "assets" / "js" / "portfolio.js").read_text(encoding="utf-8")
        for phrase in (
            "initArchitecture",
            "data-architecture-node",
            "data-architecture-mobile-node",
            "architecture-data",
            "aria-pressed",
            "event.key === 'Enter'",
            "event.key === ' '",
            "data-architecture-detail",
            "structure_type",
            "architecture-detail-tree",
            "is-related",
        ):
            self.assertIn(phrase, script)
        for retired in ("initDecisionCards", "data-decision-id", "beforeprint"):
            self.assertNotIn(retired, script)

    def test_architecture_detail_rows_support_missing_node_fields(self):
        script = (ROOT / "assets" / "js" / "portfolio.js").read_text(encoding="utf-8")
        template = (ROOT / "_includes" / "portfolio" / "architecture.html").read_text(encoding="utf-8")
        for phrase in (
            "data-architecture-detail-row",
            "row.hidden",
            "architecture-detail-row",
        ):
            self.assertIn(phrase, script + template)
        for field in ("operation", "deployment"):
            self.assertIn(f'data-architecture-detail-row="{field}"', template)

    def test_architecture_styles_cover_kinds_flows_and_mobile_layout(self):
        partial_dir = ROOT / "_sass" / "portfolio"
        styles = "\n".join(
            path.read_text(encoding="utf-8")
            for path in sorted(partial_dir.glob("*.scss"))
        )
        for selector in (
            ".architecture-node-app",
            ".architecture-node-infra",
            ".architecture-node-boundary",
            ".architecture-node-pipeline",
            ".architecture-edge-sync",
            ".architecture-edge-async",
            ".architecture-detail-grid",
            ".architecture-mobile-node",
            ".architecture-detail-tree",
        ):
            self.assertIn(selector, styles)

    def test_rendered_validator_rejects_missing_journey(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            default_html = site_dir / "index.html"
            text = default_html.read_text(encoding="utf-8")
            default_html.write_text(
                text.replace('id="career-journey"', 'id="journey-removed"', 1),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("career-journey" in error for error in errors))

    def test_rendered_flagship_is_an_implementation_architecture(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('id="flagship"', text)
            self.assertIn('id="implementation-architecture"', text)
            self.assertIn('<p class="section-number">02 · 통합 업무 플랫폼 개발</p>', text)
            self.assertEqual(text.count("data-architecture-node="), 8)
            self.assertEqual(text.count("data-architecture-mobile-node="), 8)
            self.assertEqual(text.count("data-architecture-edge="), 8)
            self.assertEqual(text.count("data-edge-from="), 8)
            self.assertEqual(text.count("data-edge-to="), 8)
            self.assertEqual(text.count("data-architecture-boundary="), 4)
            for node_id in self.verify.REQUIRED_ARCHITECTURE_NODE_IDS:
                self.assertIn(f'data-architecture-node="{node_id}"', text)
                self.assertIn(f'data-architecture-mobile-node="{node_id}"', text)
            for phrase in (
                "PRESENTATION",
                "ASYNC EXECUTION",
                "DATA & INFERENCE",
                "EXTERNAL SYSTEMS",
                "REST",
                "enqueue contract",
                "consume contract",
                "Repository 접근",
                "프로토콜별 어댑터로 격리",
                "internal HTTP",
                "내부 실행 호출",
            ):
                self.assertIn(phrase, text)
            for phrase in (
                "FLAGSHIP CASE",
                "OUTCOMES",
                "SUPPORTING EVIDENCE",
                "ENGINEERING DECISIONS",
                "data-decision-id",
            ):
                self.assertNotIn(phrase, text)

    def test_architecture_has_readable_mobile_fallback(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('id="architecture-mobile"', text)
            self.assertEqual(text.count("data-architecture-mobile-node="), 8)
            self.assertIn('id="architecture-detail"', text)
            for phrase in ("Web", "API", "Queue", "Worker", "외부 시스템 8종"):
                self.assertIn(phrase, text)

    def test_rendered_architecture_facts_keep_boundaries_and_layers_distinct(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            for phrase in (
                "플랫폼 경계 밖",
                "요청·수집·수신 세 방향",
                "EDI 810 전문 형식",
                "스케줄 수집",
                "저울 측정값",
                "TCP 클라이언트로 저울 데이터 수집",
            ):
                self.assertIn(phrase, text)
            self.assertNotIn("우리 시스템 밖", text)
            self.assertNotIn("계량기 소켓", text)
            self.assertNotIn("수신형", text)
            self.assertIn("_features/", text)
            self.assertIn("<기능>/", text)
            self.assertNotIn("features/<도메인>/", text)

    def test_rendered_tree_expansion_keeps_two_tree_markers_and_new_claims(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertEqual(text.count('"structure_type":"tree"'), 2)
            for phrase in (
                "기능이 많은 화면은 그 안에서 기능별로 다시 나눴습니다.",
                "고객사 문서라 망 밖으로 나갈 수 없어 외부 API를 쓰지 않았습니다.",
                "여러 DBMS에서 옮겨와 하나로 합친 운영 데이터",
                "스키마 변경은 마이그레이션 파일로 관리합니다.",
            ):
                self.assertIn(phrase, text)

    def test_rendered_document_flow_has_eight_nodes_and_nine_edges(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertEqual(text.count('class="document-flow-node '), 8)
            self.assertEqual(text.count('class="document-flow-edge '), 9)
            for phrase in (
                "텍스트 레이어 판정",
                "스캔본 OCR",
                "LLM 추출",
                "텍스트 있음",
                "스캔본",
                "JSON Schema · 정규식",
                "재시도 가능",
                "값 없음",
                "재처리",
                "프로세스당 1건",
                "SIGTERM",
                "SIGKILL",
                "evaluation harness",
            ):
                self.assertIn(phrase, text)
            for retired in (
                "Worker 동시성 제한",
                "품질 판정",
                "저품질 문서만 OCR로 전환",
                "OCR 자식 프로세스",
            ):
                self.assertNotIn(retired, text)
            self.assertNotIn('class="document-flow-node-info"', text)

    def test_rendered_external_structure_wraps_for_mobile(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('"structure":"요청형 EDI 전송\\n', text)

    def test_rendered_local_llm_structure_keeps_long_lines_bounded(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            self.assertIn('"structure":"텍스트 레이어 판정\\n', text)

    def test_rendered_validator_rejects_missing_architecture_node(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            default_html = site_dir / "index.html"
            text = default_html.read_text(encoding="utf-8")
            default_html.write_text(
                text.replace('data-architecture-node="web"', 'data-removed="web"', 1),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("architecture node" in error for error in errors))

    def test_rendered_profiles_include_lower_evidence_sections(self):
        for relative_path, _theme in self.verify.RENDERED_PROFILES.values():
            text = (ROOT / "_site" / relative_path).read_text(encoding="utf-8")
            for phrase in (
                'id="automation"',
                'id="experience"',
                'id="additional-work"',
                "외부 업무 시스템 입력 자동화",
                "1,200시간",
                "ILJIN Global",
                "KWE Korea",
                "Product &amp; Frontend",
            ):
                self.assertIn(phrase, text)
            for forbidden in (
                "skill-bar",
                "progress-bar",
                "aria-valuenow",
                "문의하기",
                "상담 신청",
            ):
                self.assertNotIn(forbidden, text)

    def test_rendered_validator_rejects_missing_automation(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            default_html = site_dir / "index.html"
            text = default_html.read_text(encoding="utf-8")
            default_html.write_text(
                text.replace('id="automation"', 'id="automation-removed"', 1),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("automation" in error for error in errors))

    def test_compiled_css_has_themes_motion_and_print_contracts(self):
        css_path = ROOT / "_site" / "assets" / "css" / "portfolio.css"
        self.assertTrue(css_path.is_file())
        css = css_path.read_text(encoding="utf-8")
        for phrase in (
            "--accent",
            "--accent-soft",
            "--ink",
            "--muted",
            "--rule",
            ".theme-blueprint",
            ".theme-editorial",
            "prefers-reduced-motion: reduce",
            "@media print",
            "@page",
        ):
            self.assertIn(phrase, css)
        for forbidden in ("transition: all", "@import url", "url(http"):
            self.assertNotIn(forbidden, css)

    def test_rendered_validator_rejects_missing_theme_css(self):
        with tempfile.TemporaryDirectory() as directory:
            site_dir = Path(directory)
            shutil.copytree(ROOT / "_site", site_dir, dirs_exist_ok=True)
            css_path = site_dir / "assets" / "css" / "portfolio.css"
            css = css_path.read_text(encoding="utf-8")
            css_path.write_text(
                css.replace(".theme-blueprint", ".theme-removed"),
                encoding="utf-8",
            )
            errors = self.verify.validate_rendered(site_dir)
            self.assertTrue(any("theme-blueprint" in error for error in errors))


class PortfolioPdfContractTests(unittest.TestCase):
    def setUp(self):
        self.verify = load_verifier()

    def test_pdf_builder_uses_local_http_and_atomic_outputs(self):
        build_path = ROOT / "scripts" / "build-portfolio-pdf.sh"
        self.assertTrue(build_path.is_file(), "portfolio PDF builder is missing")
        script = build_path.read_text(encoding="utf-8")
        for phrase in (
            "bundle exec jekyll build",
            "python3 -m http.server",
            "--print-to-pdf-no-header",
            "mktemp -d",
            "mv",
        ):
            self.assertIn(phrase, script)
        self.assertNotIn("rm -rf", script)

    def test_portfolio_pdf_outputs_are_not_committed_during_screen_iteration(self):
        for relative_path in self.verify.PDF_PROFILES.values():
            self.assertFalse((ROOT / relative_path).exists())


if __name__ == "__main__":
    unittest.main()
