# Fix projects where data was saved as Ruby Hash#to_s (=> instead of :)
Project.all.each do |p|
  begin
    JSON.parse(p.data, max_nesting: false)
  rescue JSON::NestingError
    # Too deep but structurally valid JSON — skip
    puts "Skip #{p.id} '#{p.title}' (nesting too deep)"
  rescue JSON::ParserError
    # Ruby hash notation: replace => with : and fix nil/true/false
    fixed = p.data
      .gsub(/"\s*=>\s*/, '": ')
      .gsub(/\bnil\b/, 'null')
    begin
      JSON.parse(fixed, max_nesting: false)
      p.update_column(:data, fixed)
      puts "Fixed #{p.id} '#{p.title}'"
    rescue => e
      puts "Cannot fix #{p.id} '#{p.title}': #{e.message}"
    end
  end
end
