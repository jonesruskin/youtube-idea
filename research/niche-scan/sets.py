"""Niche sets to scan. Each entry: key -> (search queries, title regex a result must match to count).

"broad"   — round 1, 42 candidate niches a code-animated, faceless, science-story studio could produce.
"formats" — rounds 2–3, the formats round 1 surfaced, plus three hybrids that cross them with our space-science edge.
"""
import re

def _any(*words):
    return "|".join(re.escape(w) for w in words)

BROAD = {
    "whatif_powers":       (["what if you could animation", "what if you had superpowers"], _any("what if")),
    "whatif_earth_space":  (["what if the sun disappeared", "what if earth stopped spinning"], _any("what if", "what would happen")),
    "survival_story":      (["survive 30 days animation", "could you survive"], _any("surviv", "days", "trapped", "stranded")),
    "alt_history":         (["alternate history what if", "what if history changed"], _any("what if", "alternate", "never")),
    "body_science":        (["what happens to your body if", "what happens to your body when"], _any("body", "happens", "your brain")),
    "space_scale":         (["universe size comparison", "scale of the universe"], _any("size", "scale", "comparison", "big", "universe")),
    "black_hole_cosmic":   (["black hole explained", "strangest things in the universe"], _any("black hole", "universe", "space", "star", "galaxy")),
    "future_timeline":     (["future of earth timeline", "earth in 1 billion years"], _any("future", "timeline", "years", "billion")),
    "ocean_depth":         (["ocean depth comparison", "deep sea creatures"], _any("ocean", "sea", "deep", "abyss", "underwater")),
    "prehistoric":         (["prehistoric animals", "prehistoric creatures size comparison"], _any("prehistoric", "dinosaur", "extinct", "ice age", "megalodon", "ancient")),
    "future_evolution":    (["how humans will evolve", "future evolution of humans"], _any("evol", "future human", "humans")),
    "micro_world":         (["how small is an atom", "microscopic world zoom"], _any("small", "atom", "microscop", "tiny", "zoom", "quantum")),
    "how_it_works":        (["how does it work animation", "how engines work 3d animation"], _any("how", "works", "inside")),
    "paradox_thought":     (["paradox explained", "thought experiment explained"], _any("paradox", "thought experiment", "problem", "dilemma")),
    "math_visual":         (["math explained visually", "math visualization"], _any("math", "number", "infinity", "equation", "prime", "geometry", "proof")),
    "disaster_sim":        (["asteroid impact simulation", "what if a tsunami hit"], _any("simulation", "impact", "tsunami", "asteroid", "volcano", "earthquake", "what if")),
    "day_in_life_hist":    (["a day in the life of a medieval", "life of a roman soldier"], _any("day in the life", "life of", "medieval", "roman", "ancient", "peasant", "life as")),
    "history_animated":    (["history animated documentary", "entire history of"], _any("history", "rise", "fall", "empire", "war")),
    "mythology":           (["mythology explained", "greek mythology animated"], _any("myth", "god", "legend", "norse", "greek", "egypt")),
    "ancient_mysteries":   (["ancient mysteries explained", "lost civilization"], _any("ancient", "lost", "mystery", "civilization", "pyramid", "atlantis")),
    "geography_explained": (["geography explained", "why is this country shaped"], _any("geograph", "country", "map", "border", "why", "island")),
    "map_animation":       (["history map animation", "every year map"], _any("map", "every year", "borders")),
    "language_origins":    (["evolution of language", "origin of words"], _any("language", "word", "alphabet", "letter", "speak")),
    "origins_of_things":   (["history of everyday things", "who invented"], _any("invent", "history of", "origin", "why do we", "where did")),
    "psychology":          (["psychology explained animation", "psychology facts"], _any("psycholog", "brain", "mind", "why you", "behavior")),
    "philosophy":          (["philosophy explained animated", "philosophy of life"], _any("philosoph", "stoic", "nietzsche", "meaning", "camus", "existential")),
    "money_economics":     (["economics explained", "how money works"], _any("econom", "money", "rich", "inflation", "bank", "billion", "dollar")),
    "heist_crime_anim":    (["heist explained animation", "true crime animated"], _any("heist", "crime", "robbery", "scam", "case", "murder", "stole", "prison")),
    "unsolved_mysteries":  (["unsolved mysteries", "creepy mysteries explained"], _any("mystery", "mysteries", "unsolved", "unexplained", "creepy", "strange")),
    "ai_future":           (["what if ai took over", "ai future scenario"], r"\bai\b|robot|artificial|agi|future"),
    "tech_history":        (["how computers work", "history of the internet"], _any("computer", "internet", "chip", "cpu", "tech", "software", "code")),
    "sleep_dreams":        (["science of dreams", "what happens when you sleep"], _any("dream", "sleep", "nightmare")),
    "data_comparison":     (["size comparison 3d", "population comparison"], _any("comparison", "compar", "vs", "ranking", "size")),
    "kardashev_megatech":  (["kardashev scale explained", "dyson sphere"], _any("kardashev", "dyson", "civilization", "type", "megastructure", "alien")),
    "aliens_fermi":        (["fermi paradox", "where are the aliens"], _any("alien", "fermi", "extraterrestrial", "life", "universe")),
    "space_missions":      (["space mission explained", "nasa mission animation"], _any("mission", "nasa", "apollo", "rocket", "mars", "moon", "voyager", "space")),
    "countryballs":        (["countryballs animation", "countryballs history"], _any("countryball", "polandball")),
    "food_science":        (["food science explained", "how is it made"], _any("food", "made", "eat", "cook", "chocolate", "factory")),
    "animal_vs":           (["animal vs animal who would win", "strongest animals"], _any("vs", "who would win", "strongest", "animal", "deadliest")),
    "inside_body_anim":    (["inside the human body animation", "how your immune system works"], _any("body", "cell", "immune", "blood", "organ", "virus", "bacteria")),
    "story_animation":     (["animated story", "my story animated"], _any("story", "i ", "my ")),
    "horror_animated":     (["horror story animated", "scary stories animated"], _any("horror", "scary", "creepy", "story", "stories")),
}

FORMATS = {
    "entire_history_of_x": (["the entire history of in minutes", "entire history of every country", "history of the world every year", "the entire history of explained", "history of in 10 minutes"],
                            r"entire history|history of the world|every year|in \d+ minutes|history of .* in"),
    "deep_future":         (["future of earth timeline", "the insane future of earth", "humans returned to earth after", "timeline of the far future", "what will happen in 1 billion years"],
                            r"future|years from now|billion years|returned to earth|timeline|years later"),
    "cosmic_whatif":       (["what if the sun disappeared", "what if the moon disappeared", "what if earth had rings", "what if a black hole hit earth", "what if earth stopped spinning"],
                            r"what if|what would happen"),
    "survival_timeline":   (["survival 1 year animation", "zombie apartment survival", "bunker survival 1 year", "survive 100 days animation", "trapped 30 days animation"],
                            r"surviv|1 year|100 days|30 days|trapped|bunker|zombie"),
    "every_x_explained":   (["every god explained", "every mythical creature explained", "every legendary weapon explained", "every greek god explained in minutes", "every monster explained"],
                            r"every .*explained|explained in \d+|every "),
    "myths_true":          (["myths that turned out to be true", "legends that were real", "mythical creatures that were real", "ancient myths explained", "terrifying myths explained"],
                            r"myth|legend|real|true"),
    "body_scenario":       (["what happens to your body if", "what happens if you fall into", "what happens to your body in space", "what happens if you get sucked into", "what would happen to your body"],
                            r"what happens|what would happen|your body"),
    "pov_history":         (["your first 24 hours as a", "what if you lived in medieval times", "you wake up in ancient rome", "life as a roman soldier", "could you survive in medieval"],
                            r"your |you |life as|day in the life|survive"),
    "whatif_powers":       (["what if you could", "what if you had 500 iq", "what if you were 10x faster", "what if you could stop time", "what if you could read minds"],
                            r"what if"),
    # hybrids: a proven parent format crossed with real space science
    "HYBRID_cosmic_survival":  (["surviving 1 year without the sun", "day 1 to day 100 after the sun disappeared", "how long could you survive if the sun disappeared", "surviving an asteroid impact day by day", "last human on earth survival"],
                                r"surviv|day \d|days|year|last human|how long"),
    "HYBRID_space_history":    (["entire history of the universe", "entire history of mars", "entire history of the moon", "entire history of earth in minutes", "history of the solar system explained"],
                                r"history|timeline|entire|story of"),
    "HYBRID_wake_in_future":   (["returned to earth after 1000 years", "waking up 10000 years in the future", "you wake up in the year 3000", "what earth looks like in 1 million years", "frozen for 1000 years wake up"],
                                r"future|years|year \d|wake|returned|million"),
}

SETS = {"broad": BROAD, "formats": FORMATS}
