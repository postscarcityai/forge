#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fetch timeline Fal AI links
async function fetchTimelineFalLinks(projectId = 'psai') {
  try {
    const response = await fetch(`http://localhost:3000/api/timeline/fal-links?projectId=${projectId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch timeline data');
    }
    
    console.log(`📊 Found ${data.count} Fal AI links for project: ${data.project_id}`);
    console.log(`🔍 Method used: ${data.timeline_method}`);
    
    // Extract just the URLs
    const urls = data.fal_links.map(item => item.fal_url);
    
    // Extract URLs with titles for reference
    const urlsWithTitles = data.fal_links.map(item => ({
      title: item.title,
      type: item.type,
      url: item.fal_url
    }));
    
    // Save results to files
    const outputDir = path.join(process.cwd(), 'docs', 'backlog');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save just URLs array
    const urlsFile = path.join(outputDir, `${projectId}-timeline-fal-urls.json`);
    fs.writeFileSync(urlsFile, JSON.stringify(urls, null, 2));
    
    // Save detailed list with titles
    const detailedFile = path.join(outputDir, `${projectId}-timeline-fal-detailed.json`);
    fs.writeFileSync(detailedFile, JSON.stringify(urlsWithTitles, null, 2));
    
    // Save as simple text file for easy copy/paste
    const textFile = path.join(outputDir, `${projectId}-timeline-fal-urls.txt`);
    fs.writeFileSync(textFile, urls.join('\n'));
    
    console.log(`✅ Saved ${urls.length} URLs to:`);
    console.log(`   📄 URLs only: ${urlsFile}`);
    console.log(`   📋 With details: ${detailedFile}`);
    console.log(`   📝 Text format: ${textFile}`);
    
    return {
      urls,
      urlsWithTitles,
      count: urls.length,
      method: data.timeline_method
    };
    
  } catch (error) {
    console.error('❌ Error fetching timeline Fal AI links:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const projectId = process.argv[2] || 'psai';
  console.log(`🎬 Extracting Fal AI links for project: ${projectId}`);
  
  const result = await fetchTimelineFalLinks(projectId);
  
  console.log(`\n🎯 Summary:`);
  console.log(`   Project: ${projectId}`);
  console.log(`   Total Fal AI URLs: ${result.count}`);
  console.log(`   Detection method: ${result.method}`);
  
  // Show first few URLs as preview
  console.log(`\n📋 Preview (first 3 URLs):`);
  result.urls.slice(0, 3).forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
  
  if (result.urls.length > 3) {
    console.log(`   ... and ${result.urls.length - 3} more`);
  }
}

// Run the script
main().catch(console.error); 