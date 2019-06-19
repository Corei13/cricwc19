import React, { useState, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Card from 'react-bootstrap/Card';

import './App.css';

const Flag = ({ i, size = 32 }) => <img alt="null" src={i} style={{ width: size + 'px', height: size + 'px', marginRight: '4px', marginBottom: '2px' }} />;

const Standing = ({ matches }) => {
  const teams = matches.reduce((a, { teams: T, result }) => {
    Object.entries(T).forEach(([t, { order, logo }]) => {
      if (t === 'TBA') return a;

      if (!a[t]) {
        a[t] = { M: 0, W: 0, L: 0, NR: 0, P: 0, H: '', logo };
      }
      if (result !== 'O') {
        a[t].M += 1;
        if (result === 'X') {
          a[t].H += 'X';
          a[t].NR += 1;
        } else {
          if (String(order) === result) {
            a[t].H += 'W';
            a[t].W += 1;
          } else {
            a[t].H += 'L';
            a[t].L += 1;
          }
        }
      }
      a[t].P = a[t].W * 2 + a[t].NR;
    });
    return a;
  }, {});

  return (
    <Table key="table" striped bordered hover>
      <thead>
        <tr>
          <th>Team</th>
          <th>M</th>
          <th>W</th>
          <th>L</th>
          <th>N/R</th>
          <th>P</th>
          <th>History</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(teams).sort(([, a], [, b]) => b.P - a.P).map(([name, { logo, M, W, L, NR, P, H }]) => (
          <tr key={name}>
            <td><Flag size={24} i={logo} />{name}</td>
            <td>{M}</td>
            <td>{W}</td>
            <td>{L}</td>
            <td>{NR}</td>
            <td><b>{P}</b></td>
            <td><pre>{H}</pre></td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

const Match = ({ setResult, date, summary, result, teams, _teams: [teamA, teamB] = Object.values(teams).sort((a, b) => a.order - b.order) }) =>
  !(teamA && teamB) ? null : (
    <Card className="mb-4">
      <Card.Header>
        <Row>
          <Col>
            <Card.Subtitle className="text-right"><small>{new Date(date).toDateString()}</small></Card.Subtitle>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body className="d-flex flex-column">
        <ButtonGroup size="lg">
          <Button
            onClick={() => setResult(result === '1' ? 'O' : '1')}
            style={{ width: '30%' }} variant={result === '1' ? 'success' : result === '2' ? 'danger' : 'outline-secondary'}
          >
            <Flag size={24} i={teamA.logo} /><b>{teamA.name}</b> <br /> <small>{teamA.score}</small>
          </Button>
          <Button
            onClick={() => setResult(result === 'X' ? 'O' : 'X')}
            variant={result === 'X' ? 'dark' : 'outline-secondary'}
          >N/R</Button>
          <Button
            onClick={() => setResult(result === '2' ? 'O' : '2')}
            style={{ width: '30%' }} variant={result === '2' ? 'success' : result === '1' ? 'danger' : 'outline-secondary'}
          >
            <Flag size={24} i={teamB.logo} /><b>{teamB.name}</b> <br /> <small>{teamB.score}</small>
          </Button>
        </ButtonGroup>
      </Card.Body>
      <Card.Footer>
        <Card.Subtitle><small>{summary}</small></Card.Subtitle>
      </Card.Footer>
    </Card>
  );

const Matches = ({ matches, setResult }) => (
  <>
    {matches.map((match, i) => <Match key={i} setResult={r => setResult(i, r)} {...match} />)}
  </>
);

const App = () => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [signature, setSignature] = useState('');

  useEffect(() => {
    const [, hash] = document.location.hash.match(/^#([12OX]{48})$/) || [];

    (async () => {
      const res = await fetch(
        'https://site.web.api.espn.com/apis/site/v2/sports/cricket/8039/scoreboard?lang=en&limit=300&region=bd&season=2019&section=cricinfo&sort=events%3Aasc', {
          credentials: 'omit',
          headers: { accept: 'application/json, text/plain, */*' },
          method: 'GET',
          mode: 'cors',
          referrer: 'https://www.espncricinfo.com/cricket/scores/series/8039/season/2019/icc-cricket-world-cup',
          referrerPolicy: "no-referrer-when-downgrade"
        });
        const { events } = await res.json();
        const matches = events.map(({
          date,
          status: { summary, type: { description, state } },
          competitions: [{
            competitors: [
              { score: scoreA, order: orderA, winner: winnerA, team: { shortDisplayName: teamA, logo: logoA } },
              { score: scoreB, order: orderB, winner: winnerB, team: { shortDisplayName: teamB, logo: logoB } },
            ]
          }],
        }, i) => ({
          date,
          summary,
          teams: {
            [teamA]: { name: teamA, order: orderA, score: scoreA || 'DNB', logo: logoA },
            [teamB]: { name: teamB, order: orderB, score: scoreB || 'DNB', logo: logoB },
          },
          result: hash
            ? hash[i]
            : description === 'Result'
              ? String(winnerA === 'true' ? orderA : orderB)
              : state === 'pre' ? 'O' : 'X'
        }));
        setSignature(matches.map(m => m.result).join(''));
        setMatches(matches);
        setLoading(false);
    })();
  }, []);

  useEffect(() => {
    document.location.hash = signature;
  }, [signature]);

  const setResult = (matchId, result) => {
    matches[matchId].result = result;
    setMatches(matches);
    setSignature(matches.map(m => m.result).join(''));
  };

  return (
    <Container fluid className="mt-4">
      <Row>
        {loading ? (
          <Col>
            <Alert variant="light">
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              /> Loading...
            </Alert>
          </Col>
        ) : (
          <>
            <Col lg={{ offset: 1, span: 4 }} >
              <Standing matches={matches} />
            </Col>
            <Col lg={{ offset: 1, span: 5 }} style={{ height: '100vh', overflowY: 'scroll' }}>
              <Matches matches={matches} setResult={setResult} />
            </Col>
          </>
        )}
      </Row>
    </Container>
  );
}

export default App;
