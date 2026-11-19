#!/bin/bash
# render every missing segment one at a time, each split across 4 processes, then the rest of the pipeline
cd /home/user/youtube-idea/cinema
for s in $(python3 -c "
import importlib,os; m=importlib.import_module('ep_tanis.script')
print(' '.join(s['id'] for s in m.SEGMENTS if not os.path.exists(f'build/ep_tanis/segments/{s[\"id\"]}.mp4')))"); do
  # 4 workers, falling back to 3 then 2 if one is killed for memory (finished chunks are kept)
  python3 -m engine.render ep_tanis --only "$s" --chunked --jobs 4 >> build/ep_tanis/render.log 2>&1 || \
  python3 -m engine.render ep_tanis --only "$s" --chunked --jobs 4 --max-par 3 >> build/ep_tanis/render.log 2>&1 || \
  python3 -m engine.render ep_tanis --only "$s" --chunked --jobs 4 --max-par 2 >> build/ep_tanis/render.log 2>&1 || exit 1
done
bash build/ep_tanis/run.sh
