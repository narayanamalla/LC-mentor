// Simple LaTeX escaping
const escapeLatex = (str: string) => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/~/g, '\\textasciitilde{}');
};

export function convertMarkdownToLaTeX(text: string): string {
  if (!text) return '';
  const parts = text.split(/```(?:cpp|c\+\+|json|javascript|ts|typescript)?/gi);
  let result = '';

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // Code block
      const code = parts[i].trim();
      result += `\n\\begin{lstlisting}\n${code}\n\\end{lstlisting}\n`;
    } else {
      // Normal text, handle inline code backticks
      const textPart = parts[i];
      const inlineParts = textPart.split('`');
      let escapedText = '';
      for (let j = 0; j < inlineParts.length; j++) {
        if (j % 2 === 1) {
          escapedText += `\\texttt{${escapeLatex(inlineParts[j])}}`;
        } else {
          escapedText += escapeLatex(inlineParts[j]);
        }
      }
      result += escapedText;
    }
  }
  return result;
}

export interface LaTeXReportProblem {
  id: number;
  title: string;
  difficulty: string;
  topics: string[];
  problemUnderstanding: string;
  examplesAndDryRun: string;
  patternRecognition: string;
  bruteForce: {
    intuition: string;
    thoughtProcess: string;
    algorithm: string;
    code: string;
    complexityTime: string;
    complexitySpace: string;
    tleReason: string;
  };
  betterSolution: {
    exists: boolean;
    explanation: string;
    code: string;
    complexityTime: string;
    complexitySpace: string;
  };
  optimalSolution: {
    coreObservation: string;
    whyItWorks: string;
    explanation: string;
    code: string;
    lineByLineExplanation: string;
  };
  detailedDryRun: string;
  complexityAnalysis: {
    timeComplexity: string;
    timeComplexityReason: string;
    spaceComplexity: string;
    spaceComplexityReason: string;
    bestCase?: string;
    averageCase?: string;
    worstCase?: string;
  };
  interviewDiscussion: {
    whyAsked: string;
    followUps: string[];
    commonMistakes: string[];
    edgeCases: string[];
    howToExplain: string;
  };
  similarProblems: {
    easier: string[];
    similar: string[];
    harder: string[];
  };
  keyTakeaways: {
    pattern: string;
    importantObservation: string;
    complexity: string;
    interviewTrick: string;
    commonPitfall: string;
  };
  alternativeApproaches: string;
  edgeCasesChecklist: Array<{
    caseName: string;
    matters: boolean;
    explanation: string;
  }>;
  reusableTemplate: string;
}

export function generateLaTeXTemplate(data: {
  date: string;
  problems: Array<{ id: number; title: string; difficulty: string; topics: string[] }>;
  solutions: LaTeXReportProblem[];
  weakTopics: string[];
  recommendations: string[];
  analytics: {
    totalSolved: number;
    streak: number;
    difficultyCounts: { Easy: number; Medium: number; Hard: number };
  };
}): string {
  const solvedSection = data.problems.map(p => 
    `\\item \\textbf{LC ${p.id}: ${escapeLatex(p.title)}} \\hfill \\textit{${escapeLatex(p.difficulty)}} \\\\ Topic tags: ${escapeLatex(p.topics.join(', '))}`
  ).join('\n');

  const problemSections = data.solutions.map(sol => {
    const followUpsBullets = (sol.interviewDiscussion.followUps || [])
      .map(f => `\\item ${convertMarkdownToLaTeX(f)}`)
      .join('\n');

    const mistakesBullets = (sol.interviewDiscussion.commonMistakes || [])
      .map(m => `\\item ${convertMarkdownToLaTeX(m)}`)
      .join('\n');

    const edgeCasesBullets = (sol.interviewDiscussion.edgeCases || [])
      .map(e => `\\item ${convertMarkdownToLaTeX(e)}`)
      .join('\n');

    const edgeCasesChecklistBullets = (sol.edgeCasesChecklist || [])
      .map(item => `\\item \\textbf{[${item.matters ? 'x' : ' '}] ${escapeLatex(item.caseName)}}: ${convertMarkdownToLaTeX(item.explanation)}`)
      .join('\n');

    const caseComplexityLines = [
      sol.complexityAnalysis.bestCase ? `\\item \\textbf{Best Case:} ${convertMarkdownToLaTeX(sol.complexityAnalysis.bestCase)}` : '',
      sol.complexityAnalysis.averageCase ? `\\item \\textbf{Average Case:} ${convertMarkdownToLaTeX(sol.complexityAnalysis.averageCase)}` : '',
      sol.complexityAnalysis.worstCase ? `\\item \\textbf{Worst Case:} ${convertMarkdownToLaTeX(sol.complexityAnalysis.worstCase)}` : ''
    ].filter(l => l.length > 0).join('\n');

    const betterSolutionSection = sol.betterSolution.exists
      ? `
\\section*{5. Better Solution}
\\textbf{Observation \\& Concept:} \\\\
${convertMarkdownToLaTeX(sol.betterSolution.explanation)}

\\begin{lstlisting}
${sol.betterSolution.code}
\\end{lstlisting}
\\textbf{Complexity:} Time: ${escapeLatex(sol.betterSolution.complexityTime)} | Space: ${escapeLatex(sol.betterSolution.complexitySpace)}
`
      : '';

    return `
\\newpage
\\begin{center}
{\\Large\\bfseries LC ${sol.id}: ${escapeLatex(sol.title)} | FAANG Revision Guide}\\\\[0.1cm]
\\textit{Difficulty: ${escapeLatex(sol.difficulty)} | Topics: ${escapeLatex(sol.topics.join(', '))}}
\\end{center}

\\vspace{0.2cm}

\\section*{1. Problem Understanding}
${convertMarkdownToLaTeX(sol.problemUnderstanding)}

\\section*{2. Examples and Dry Run}
${convertMarkdownToLaTeX(sol.examplesAndDryRun)}

\\section*{3. Pattern Recognition}
\\begin{tcolorbox}[colback=lightblue, colframe=mainblue, title=DSA Pattern Recognition, fonttitle=\\bfseries\\small]
${convertMarkdownToLaTeX(sol.patternRecognition)}
\\end{tcolorbox}

\\section*{4. Brute Force Solution}
\\textbf{Intuition:} ${convertMarkdownToLaTeX(sol.bruteForce.intuition)} \\\\
\\textbf{Thought Process:} ${convertMarkdownToLaTeX(sol.bruteForce.thoughtProcess)} \\\\
\\textbf{Algorithm:} ${convertMarkdownToLaTeX(sol.bruteForce.algorithm)}

\\begin{lstlisting}
${sol.bruteForce.code}
\\end{lstlisting}

\\textbf{Complexity:} Time: ${escapeLatex(sol.bruteForce.complexityTime)} | Space: ${escapeLatex(sol.bruteForce.complexitySpace)} \\\\
\\textbf{TLE Reason:} ${convertMarkdownToLaTeX(sol.bruteForce.tleReason)}

${betterSolutionSection}

\\section*{6. Optimal Solution}
\\begin{tcolorbox}[colback=lightgreen, colframe=green!60!black, title=Optimal Core Observation, fonttitle=\\bfseries\\small]
\\textbf{Core Insight:} ${convertMarkdownToLaTeX(sol.optimalSolution.coreObservation)} \\\\
\\textbf{Why it Works:} ${convertMarkdownToLaTeX(sol.optimalSolution.whyItWorks)}
\\end{tcolorbox}

\\textbf{Step-by-Step Intuition:} \\\\
${convertMarkdownToLaTeX(sol.optimalSolution.explanation)}

\\subsection*{Complete Optimal C++ Code}
\\begin{lstlisting}
${sol.optimalSolution.code}
\\end{lstlisting}

\\subsection*{Line-by-Line Explanation}
${convertMarkdownToLaTeX(sol.optimalSolution.lineByLineExplanation)}

\\section*{7. Detailed Dry Run of Optimal Solution}
${convertMarkdownToLaTeX(sol.detailedDryRun)}

\\section*{8. Complexity Analysis}
\\begin{itemize}
  \\item \\textbf{Time Complexity:} ${convertMarkdownToLaTeX(sol.complexityAnalysis.timeComplexity)} --- ${convertMarkdownToLaTeX(sol.complexityAnalysis.timeComplexityReason)}
  \\item \\textbf{Space Complexity:} ${convertMarkdownToLaTeX(sol.complexityAnalysis.spaceComplexity)} --- ${convertMarkdownToLaTeX(sol.complexityAnalysis.spaceComplexityReason)}
  ${caseComplexityLines}
\\end{itemize}

\\section*{9. Interview Discussion}
\\textbf{Why Interviewer Asks:} ${convertMarkdownToLaTeX(sol.interviewDiscussion.whyAsked)} \\\\
\\textbf{Follow-up Questions:}
\\begin{itemize}
  ${followUpsBullets || '\\item None logged.'}
\\end{itemize}
\\textbf{Common Candidate Mistakes:}
\\begin{itemize}
  ${mistakesBullets || '\\item None logged.'}
\\end{itemize}
\\textbf{Edge Cases to Cover:}
\\begin{itemize}
  ${edgeCasesBullets || '\\item None logged.'}
\\end{itemize}
\\textbf{How to Explain in Interview:} \\\\
${convertMarkdownToLaTeX(sol.interviewDiscussion.howToExplain)}

\\section*{10. Similar Problems}
\\begin{itemize}
  \\item \\textbf{Easier Problems:} ${escapeLatex((sol.similarProblems.easier || []).join(', '))}
  \\item \\textbf{Similar Problems:} ${escapeLatex((sol.similarProblems.similar || []).join(', '))}
  \\item \\textbf{Harder Variations:} ${escapeLatex((sol.similarProblems.harder || []).join(', '))}
\\end{itemize}

\\section*{11. Key Takeaways}
\\begin{tcolorbox}[colback=yellow!10, colframe=orange, title=Interview Summary, fonttitle=\\bfseries\\small]
\\begin{itemize}
  \\item \\textbf{Pattern:} ${convertMarkdownToLaTeX(sol.keyTakeaways.pattern)}
  \\item \\textbf{Observation:} ${convertMarkdownToLaTeX(sol.keyTakeaways.importantObservation)}
  \\item \\textbf{Complexity:} ${convertMarkdownToLaTeX(sol.keyTakeaways.complexity)}
  \\item \\textbf{Interview Trick:} ${convertMarkdownToLaTeX(sol.keyTakeaways.interviewTrick)}
  \\item \\textbf{Pitfall to Avoid:} ${convertMarkdownToLaTeX(sol.keyTakeaways.commonPitfall)}
\\end{itemize}
\\end{tcolorbox}

\\section*{12. Alternative Approaches}
${convertMarkdownToLaTeX(sol.alternativeApproaches)}

\\section*{13. Edge Cases Checklist}
\\begin{itemize}
  ${edgeCasesChecklistBullets || '\\item None.'}
\\end{itemize}

\\section*{14. Reusable Template}
\\begin{lstlisting}
${sol.reusableTemplate}
\\end{lstlisting}
`;
  }).join('\n');

  const recommendationsSection = data.recommendations.map(r => `\\item ${escapeLatex(r)}`).join('\n');
  const weakTopicsList = data.weakTopics.map(w => `\\item \\textbf{${escapeLatex(w)}}`).join('\n');

  return `\\documentclass[10pt]{article}
\\usepackage[a4paper,margin=0.5in]{geometry}
\\usepackage[dvipsnames]{xcolor}
\\usepackage{amsmath}
\\usepackage[most]{tcolorbox}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta,positioning}
\\usepackage{listings}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{lmodern}
\\usepackage{multicol}

% ---------- Colors ----------
\\definecolor{mainblue}{RGB}{41,128,185}
\\definecolor{lightblue}{RGB}{232,244,252}
\\definecolor{lightgreen}{RGB}{220,255,220}
\\definecolor{lightred}{RGB}{255,235,235}

% ---------- Section Style (Compacted) ----------
\\titleformat{\\section}
{\\large\\bfseries\\color{mainblue}}
{\\thesection}{0.5em}{}
\\titlespacing*{\\section}{0pt}{1ex plus 0.5ex minus .1ex}{0.5ex plus .1ex}

% ---------- Global List Spacing ----------
\\setlist{noitemsep, topsep=2pt, parsep=0pt, partopsep=0pt}

% ---------- TColorBox Compact Defaults ----------
\\tcbset{boxsep=2pt, left=6pt, right=6pt, top=4pt, bottom=4pt}

% ---------- Listings ----------
\\lstset{
  language=C++,
  basicstyle=\\ttfamily\\footnotesize,
  keywordstyle=\\color{blue},
  commentstyle=\\color{green!50!black},
  numbers=left,
  numberstyle=\\tiny,
  frame=single,
  breaklines=true,
  showstringspaces=false,
  aboveskip=2pt,
  belowskip=2pt
}

\\begin{document}

\\begin{center}
{\\Large\\bfseries LeetCode Mentor - Daily Learning Report}\\\\[0.1cm]
\\textbf{Revision Companion} \\hfill \\textbf{Date: ${escapeLatex(data.date)}}
\\end{center}

\\section*{Progress \\& Analytics Snapshot}
\\begin{itemize}
  \\item \\textbf{Total Solved to Date:} ${data.analytics.totalSolved}
  \\item \\textbf{Current Streak:} ${data.analytics.streak} days
  \\item \\textbf{Difficulty Breakdown:} Easy: ${data.analytics.difficultyCounts.Easy}, Medium: ${data.analytics.difficultyCounts.Medium}, Hard: ${data.analytics.difficultyCounts.Hard}
\\end{itemize}

\\section*{Problems Solved Today}
\\begin{itemize}
  ${solvedSection || '\\item No problems logged for today.'}
\\end{itemize}

\\newpage

% Core Problem sections
${problemSections || 'No new problems covered today.'}

\\section*{Weak Areas \\& Recommended Revision}
\\subsection*{Identified Weak Areas}
\\begin{itemize}
  ${weakTopicsList || '\\item No critical weak areas detected today! Keep it up.'}
\\end{itemize}

\\subsection*{Recommended Revision Actions}
\\begin{itemize}
  ${recommendationsSection || '\\item Keep revising previous topic summaries.'}
\\end{itemize}

\\vfill
\\centering
\\textit{“LeetCode tracks submissions. LeetCode Mentor tracks understanding.”}

\\end{document}`;
}

export function convertLaTeXToHTML(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:\r\n|\r|\n){2,}/g, '<br/><br/>')
    .replace(/(?:\\n){2,}/g, '<br/><br/>')
    .replace(/\r\n|\r|\n/g, '<br/>')
    .replace(/\\n/g, '<br/>')
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>')
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\\(|\\\)/g, '$')
    .replace(/\\_/g, '_')
    .replace(/\\\^/g, '^')
    .replace(/\\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\#/g, '#')
    .replace(/\\begin\{lstlisting\}([\s\S]*?)\\end\{lstlisting\}/g, '<pre style="background:#f8fafc; padding:12px; border-radius:6px; font-family:monospace; overflow-x:auto; margin:10px 0; border:1px solid #cbd5e1; color:#0f172a; text-align:left;"><code>$1</code></pre>')
    .replace(/\\begin\{itemize\}/g, '<ul>')
    .replace(/\\end\{itemize\}/g, '</ul>')
    .replace(/\\item/g, '<li>')
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}');
}

export function generateHTMLReport(data: {
  date: string;
  problems: Array<{ id: number; title: string; difficulty: string; topics: string[] }>;
  topics: Array<{
    topic: string;
    theory: string;
    patternRecognition: string;
    templateCode: string;
    bruteForce: string;
    optimizedLogic: string;
    interviewTips: string;
    complexityAnalysis: string;
    optimalCode: string;
    similarProblems: string[];
  }>;
  weakTopics: string[];
  recommendations: string[];
  analytics: {
    totalSolved: number;
    streak: number;
    difficultyCounts: { Easy: number; Medium: number; Hard: number };
  };
}): string {
  const solvedRows = data.problems.map(p => `
    <div style="padding: 10px 14px; margin-bottom: 8px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 14px;">
        <span style="color: #1e293b;">LC ${p.id}: ${p.title}</span>
        <span style="color: ${p.difficulty === 'Easy' ? '#10b981' : p.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'};">${p.difficulty}</span>
      </div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Topics: ${p.topics.join(', ')}</div>
    </div>
  `).join('');

  const briefTopicSummaries = data.topics.map(t => {
    // Take the first couple of sentences from theory to keep it brief
    const shortTheory = t.theory.split(/[.!?]/).slice(0, 2).join('.') + '.';
    return `
      <div style="margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
        <strong style="color: #1e3a8a; font-size: 14px;">${t.topic}</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; line-height: 1.5;">
          ${shortTheory}
        </p>
      </div>
    `;
  }).join('');

  const weakList = data.weakTopics.map(w => `<li style="margin-bottom: 4px;"><strong>${w}</strong></li>`).join('');
  const recList = data.recommendations.map(r => `<li style="margin-bottom: 4px;">${r}</li>`).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>LeetCode Mentor Revision Summary</title>
  </head>
  <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f6f9;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
      
      <!-- Premium Header Banner -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">LeetCode Mentor</h1>
        <div style="font-size: 13px; opacity: 0.9; margin-top: 6px;">Daily revision summary for ${data.date}</div>
      </div>

      <div style="padding: 24px;">
        <!-- Greeting -->
        <p style="margin-top: 0; font-size: 15px; color: #1e293b;">Hello!</p>
        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          Congratulations on maintaining your practice! Below is a summary of the LeetCode problems solved today, key concept highlights, and your revision companion.
        </p>

        <!-- Stats Grid -->
        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
          <div style="flex: 1; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #1e3a8a;">${data.analytics.totalSolved}</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px;">Total Solved</div>
          </div>
          <div style="flex: 1; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #b45309;">${data.analytics.streak} 🔥</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px;">Streak Days</div>
          </div>
          <div style="flex: 1; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; display: flex; align-items: center; justify-content: center; flex-direction: column;">
            <div style="font-size: 11px; font-weight: 700; color: #1e293b;">
              E: ${data.analytics.difficultyCounts.Easy} | M: ${data.analytics.difficultyCounts.Medium} | H: ${data.analytics.difficultyCounts.Hard}
            </div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; margin-top: 4px;">Difficulty Ratio</div>
          </div>
        </div>

        <!-- Problems Solved Section -->
        <h2 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 12px 0;">Problems Solved Today</h2>
        ${solvedRows || '<p style="font-size: 13px; color: #64748b;">No problems solved today.</p>'}

        <!-- Brief Concept Highlights -->
        <h2 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 24px 0 12px 0;">Key Concept Highlights</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
          ${briefTopicSummaries || '<p style="font-size: 13px; color: #64748b; margin: 0;">No new concepts covered today.</p>'}
        </div>

        <!-- Focus & Recommendations -->
        <h2 style="font-size: 16px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 24px 0 12px 0;">Focus & Practice Actions</h2>
        <div style="background: #fffdf5; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; font-size: 13px;">
          <strong style="color: #b45309;">Identified Revision Topics:</strong>
          <ul style="margin: 6px 0 12px 0; padding-left: 20px;">
            ${weakList || '<li>No critical weak areas today! Keep practicing.</li>'}
          </ul>
          <strong style="color: #b45309;">Recommended Actions:</strong>
          <ul style="margin: 6px 0 0 0; padding-left: 20px;">
            ${recList || '<li>No specific actions today. Keep revision streak!</li>'}
          </ul>
        </div>

        <!-- Attached PDF Revision Call To Action -->
        <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 4px;">📬</div>
          <strong style="color: #166534; font-size: 14px; display: block; margin-bottom: 4px;">Detailed Revision Companion Attached!</strong>
          <span style="font-size: 13px; color: #14532d; display: block; line-height: 1.5;">
            We have attached a premium PDF revision companion containing key observations, brute force analysis, optimized ideas, ASCII visualizations, step-by-step algorithms, trace walkthroughs, and optimal C++ code. Please download and practice it for your interview revision!
          </span>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; font-style: italic;">
        "LeetCode tracks submissions. LeetCode Mentor tracks understanding."
      </div>
    </div>
  </body>
  </html>
  `;
}
