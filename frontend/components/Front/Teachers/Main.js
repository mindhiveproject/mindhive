import Link from "next/link";

import Tools from "./Tools";
import Program from "./Program";

export default function TeachersInformation() {
  return (
    <div>
      <div className="white">
        <h1 className="centered">
          Support your students in engaging in authentic human brain and
          behavior science research
        </h1>
        <p className="centered">
          MindHive is an online, open science, citizen science platform to
          support human brain and behavior science inquiry for learners and
          educators who seek authentic STEM research experiences. The MindHive
          platform features a suite of online tools that support learners’
          research activities, paired with teaching materials that illustrate
          and contextualize human brain and behavior research concepts and Open
          Science principles. The MindHive program emphasizes collaboration: it
          is co-designed by a team of educational researchers, teachers,
          cognitive and social scientists, UX researchers, and developers; and
          supports collaboration between students from schools across the
          country, professional scientists, and community members. Explore the
          links and materials below to learn how MindHive may help you in your
          teaching goals.
        </p>
        <div className="centered">
          <a
            target="_blank"
            href="https://docs.google.com/forms/d/e/1FAIpQLSfeaomKF-CrgKPAWF--Dy-IQpxjX1ginylqRJQ11SSnRjXKmQ/viewform?usp=sf_link"
          >
            <button>Interested? Fill out our contact form</button>
          </a>
        </div>
        <p className="centered">
          Or email us directly at{" "}
          <a href="mailto:info@mindhive.science">info@mindhive.science</a>
        </p>
      </div>

      <div className="greyOuter">
        <div className="greyInner doubled">
          <div>
            <h2>Student-driven citizen science</h2>
            <p>
              MindHive carries citizen science to the next level by supporting
              student-teacher-scientist (STS) partnerships where research
              projects are{" "}
              <strong>
                not just scientist-initiated, but also student-initiated, or
                developed in student-scientist partnerships
              </strong>
              .
            </p>
            <p>
              The MindHive platform supports{" "}
              <strong>
                students in participating in and learning from studies designed
                by professional scientists as well as other students, generating
                their own research questions and hypotheses, designing research
                studies, giving and receiving peer feedback, collecting and
                analyzing data, and presenting their results.
              </strong>
            </p>
            <p>
              The <em>MindHive</em>{" "}
              <strong>
                curriculum guides students through the full process of science
                inquiry. Students learn about basic principles and methods in
                human brain and behavior science, engage in questions around
                research ethics and citizen science, and discuss the processes
                that drive scientific discovery and rigor
              </strong>
              .
            </p>
          </div>
          <div className="videoWrapper">
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/VRxvufd5aBc"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      <div className="white">
        <h2 className="centered">See how it works</h2>
        <div className="cards">
          <div className="card sky">
            <div className="cardHeader">
              <h4>MINDHIVE CURRICULUM</h4>
            </div>
            <div className="innerCard stretchedBlockForTwo">
              <div>
                <h5>
                  Student as <span className="underscored">Learner</span>
                </h5>
                <p>
                  Students engage in MindHive lessons designed to introduce
                  concepts and skills relating to citizen science, human brain
                  and behavior research, and the process of conducting
                  scientific research
                </p>
              </div>
              <div>
                <Link href="/teachers#curriculum">
                  <button className="secondary">See sample curriculum</button>
                </Link>
              </div>
            </div>
          </div>

          <div className="card pine">
            <div className="cardHeader">
              <h4>MINDHIVE STUDIES</h4>
            </div>
            <div className="innerCard stretchedBlockForTwo">
              <div>
                <h5>
                  Student as <span className="underscored">Participant</span>
                </h5>
                <p>
                  Students use the MindHive platform to participate and reflect
                  on studies designed by professional cognitive and social
                  neuroscientists, community organizers, and students across the
                  country
                </p>
              </div>
              <div>
                <Link href="/discover">
                  <button className="secondary">View our studies</button>
                </Link>
              </div>
            </div>
          </div>

          <div className="card yellow">
            <div className="cardHeader">
              <h4>MINDHIVE TOOLS</h4>
            </div>
            <div className="innerCard stretchedBlockForTwo">
              <div>
                <h5>
                  Student as <span className="underscored">Scientist</span>
                </h5>
                <p>
                  Students design their own studies, review and participate in
                  studies designed by students from a network of schools across
                  the country, collect and analyze research data, and generate
                  research reports
                </p>
              </div>
              <div>
                <a
                  target="_blank"
                  href="https://docs.google.com/document/d/1LqCdIvmWoTe7n9eGwk41ZawJOeAHOXQwiLdBmQhKFAw/edit?usp=sharing"
                >
                  <button className="secondary">Explore our tools</button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {false && (
        <div className="white" id="tools">
          <h2 className="centered">
            Our tools for collaborative science inquiry
          </h2>
          <Tools />
        </div>
      )}

      <div className="white" id="curriculum">
        <h2 className="centered">
          The MindHive program & curriculum materials
        </h2>
        <p className="centered">
          MindHive lessons can be flexibly implemented and mix ‘n matched to fit
          your specific STEM teaching needs. Learning materials are designed to
          align with NGSS standards and are structured to follow the “5 E’s”
          (Engage, Explore, Explain, Elaborate, and Evaluate) and scaffold
          students in gaining research experience in a collaborative citizen
          science environment with students from schools across the country,
          professional scientists, and community members.
        </p>
        <Program />
      </div>

      <div className="greyOuter">
        <div className="greyInner doubled">
          <div>
            <img src="/assets/teachers/grace-church-school.png" />
          </div>
          <div className="stretchedBlockForTwo">
            <div>
              <h3>CASE STUDY</h3>
              <h2>Grace Church School</h2>
              <p>
                MindHive was first launched in March of 2020 as part of a pilot
                implementation with 17 Environmental Science students in
                Manhattan. New York City was the epicenter of the COVID-19
                pandemic and the MindHive team and students entered the US
                lockdown together and shifted to “zoom school”. The curriculum
                was (re)framed to use COVID-19 to illustrate scientific
                discovery in an ongoing crisis.
              </p>
            </div>
            <div>
              <a
                target="_blank"
                href="https://inside.gcschool.org/teaching/2020/04/20/the-adaptability-of-scientific-collaboration-in-times-of-crisis/
"
              >
                <button className="secondary">
                  Read more about our pilot at Grace Church School
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="white centered">
        <h2>Interested in bringing MindHive to your classroom?</h2>
        <div>
          <a
            target="_blank"
            href="https://docs.google.com/forms/d/e/1FAIpQLSfeaomKF-CrgKPAWF--Dy-IQpxjX1ginylqRJQ11SSnRjXKmQ/viewform?usp=sf_link"
          >
            <button>Get in touch!</button>
          </a>
        </div>

        <p>
          Or email us directly to{" "}
          <a href="mailto:info@mindhive.science">info@mindhive.science</a>
        </p>
      </div>
    </div>
  );
}
