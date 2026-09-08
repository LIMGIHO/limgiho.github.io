require "jekyll"
require "tmpdir"

root = File.expand_path("..", __dir__)
general = "반복되는 수작업과 실수를 시스템으로 줄이는 개발자 임기호입니다."
backend = "업무 데이터의 정확성과 시스템의 안정성을 중요하게 생각하는 백엔드 개발자 임기호입니다."

cases = [
  [{}, general, backend],
  [{ "about_variant" => "general" }, general, backend],
  [{ "about_variant" => "backend" }, backend, general],
  [{ "about_variant" => "unknown" }, general, backend],
  [{ "about_variant" => nil }, general, backend]
]

cases.each do |override, expected, hidden|
  Dir.mktmpdir("resume-about-test-") do |destination|
    config = Jekyll.configuration({
      "source" => root,
      "config" => File.join(root, "_config.yml"),
      "destination" => destination,
      "quiet" => true
    }.merge(override))
    Jekyll::Site.new(config).process
    html = File.read(File.join(destination, "index.html"))
    label = override.empty? ? "default" : override.inspect
    raise "#{label}: expected introduction missing" unless html.include?(expected)
    raise "#{label}: inactive introduction rendered" if html.include?(hidden)
    raise "#{label}: first sentence emphasis missing" unless html.include?(%(<p class="hero-kicker">#{expected}</p>))
    raise "#{label}: image enlargement missing" unless html.include?("profile-image-button")
    raise "#{label}: image caption missing" unless html.include?("우매함의 봉우리를 경계하며")
    puts "PASS: #{label}"
  end
end
