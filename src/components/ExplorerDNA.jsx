import { calculateDNA } from '../utils/explorerDNA';

function DonutBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'capitalize' }}>{label}</span>
        <span style={{ fontSize:12, color, fontWeight:600 }}>{pct}%</span>
      </div>
      <div style={{ height:6, background:'#1e2130', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.6s ease' }} />
      </div>
    </div>
  );
}

const CAT_COLORS = {
  nature:'#1D9E75', waterfall:'#2B9FAA', hidden:'#c9a84c',
  viewpoint:'#4A7FC1', beach:'#0EA5E9', historic:'#B05C3A', cave:'#7C3AED',
};

export default function ExplorerDNA({ userId }) {
  if (!userId) return null;
  const dna = calculateDNA(userId);
  const total = Object.values(dna.categories).reduce((a, b) => a + b, 0);
  if (total === 0) return (
    <div style={{ background:'#0d0f18', border:'1px solid #1e2130', borderRadius:12,
      padding:'16px 20px', fontFamily:'system-ui', textAlign:'center' }}>
      <div style={{ fontSize:28, marginBottom:8 }}>🧬</div>
      <div style={{ fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
        View more places to unlock your Explorer DNA profile
      </div>
    </div>
  );

  return (
    <div style={{ background:'#0d0f18', border:`1px solid ${dna.color}44`,
      borderRadius:12, overflow:'hidden', fontFamily:'system-ui', marginBottom:16 }}>

      {/* DNA Header */}
      <div style={{ background:`linear-gradient(135deg,${dna.color}18,transparent)`,
        padding:'18px 20px', borderBottom:'1px solid #1e2130',
        display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:60, height:60, borderRadius:'50%', flexShrink:0,
          background:`${dna.color}22`, border:`2px solid ${dna.color}`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
          {dna.icon}
        </div>
        <div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
            letterSpacing:'0.12em', fontWeight:600, marginBottom:4 }}>
            🧬 Explorer DNA
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:dna.color, fontFamily:'Georgia,serif', marginBottom:2 }}>
            {dna.type}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>
            {dna.description}
          </div>
        </div>
      </div>

      <div style={{ padding:'16px 20px' }}>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
          {[
            { label:'Places Viewed', value:dna.totalViewed,   color:'#e8e4dc' },
            { label:'States',        value:dna.uniqueStates,  color:dna.color  },
            { label:'Level',         value:dna.level,         color:'#c9a84c'  },
          ].map(item => (
            <div key={item.label} style={{ background:'#111318', border:'1px solid #1e2130',
              borderRadius:8, padding:'10px', textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:700, color:item.color, marginBottom:2 }}>
                {item.value}
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)',
                textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
            letterSpacing:'0.08em', fontWeight:600, marginBottom:10 }}>
            📊 Exploration Breakdown
          </div>
          {Object.entries(dna.categories).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, count]) => (
            <DonutBar key={cat} label={cat} count={count} total={total}
              color={CAT_COLORS[cat] || '#8a8272'} />
          ))}
        </div>

        {/* Top states */}
        {dna.topStates.length > 0 && (
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
              letterSpacing:'0.08em', fontWeight:600, marginBottom:8 }}>
              🗺 Favorite States
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {dna.topStates.map(s => (
                <span key={s} style={{ background:`${dna.color}18`, border:`1px solid ${dna.color}44`,
                  borderRadius:20, padding:'4px 12px', fontSize:12, color:dna.color, fontWeight:600 }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
